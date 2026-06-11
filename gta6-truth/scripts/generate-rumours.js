const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataPath = path.join(root, "data", "stories.json");

const CATEGORY_LABELS = {
  leak: "Leak",
  analysis: "Analysis",
  local: "Local chaos"
};

const ACCENTS = new Set(["blue", "sunset", "green", "yellow", "red"]);
const CATEGORIES = new Set(Object.keys(CATEGORY_LABELS));

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 74);
}

function uniqueSlug(title, usedSlugs) {
  const base = slugify(title) || `automated-rumour-${Date.now()}`;
  let slug = base;
  let index = 2;

  while (usedSlugs.has(slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getResponseText(responseJson) {
  if (typeof responseJson.output_text === "string") {
    return responseJson.output_text;
  }

  const chunks = [];
  for (const output of responseJson.output || []) {
    for (const content of output.content || []) {
      if (typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function coerceStory(rawStory, usedSlugs, todayLabel) {
  const title = cleanText(rawStory.title, 100);
  const description = cleanText(rawStory.description, 170, {
    addEllipsis: true,
    preferSentence: true
  });
  const body = Array.isArray(rawStory.body)
    ? rawStory.body.map((paragraph) => cleanText(paragraph, 650)).filter(Boolean)
    : [];

  if (!title || !description || body.length < 3) {
    throw new Error("Generated story is missing a title, description, or at least 3 body paragraphs.");
  }

  const category = CATEGORIES.has(rawStory.category) ? rawStory.category : "analysis";
  const accent = ACCENTS.has(rawStory.accent) ? rawStory.accent : "blue";
  const readTime = /^\d+\s+min read$/.test(rawStory.readTime || "") ? rawStory.readTime : "3 min read";

  return {
    slug: uniqueSlug(title, usedSlugs),
    category,
    categoryLabel: CATEGORY_LABELS[category],
    badge: cleanText(rawStory.badge, 28) || "Unverified",
    accent,
    title,
    description,
    imageUrl: "",
    imageAlt: "",
    author: cleanText(rawStory.author, 42) || "Auto Rumour Desk",
    readTime,
    date: todayLabel,
    generatedBy: "auto-rumour-bot",
    body
  };
}

function cleanText(value, maxLength, options = {}) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[{}<>]/g, "")
    .trim();

  if (text.length <= maxLength) return text;

  return truncateText(text, maxLength, options);
}

function truncateText(text, maxLength, { addEllipsis = false, preferSentence = false } = {}) {
  const suffix = addEllipsis ? "..." : "";
  const limit = Math.max(1, maxLength - suffix.length);
  const slice = text.slice(0, limit + 1).trim();

  if (preferSentence) {
    const sentenceEnd = Math.max(
      slice.lastIndexOf("."),
      slice.lastIndexOf("!"),
      slice.lastIndexOf("?")
    );

    if (sentenceEnd >= Math.floor(limit * 0.45)) {
      return slice.slice(0, sentenceEnd + 1).trim();
    }
  }

  const wordEnd = slice.lastIndexOf(" ");
  const trimmed = wordEnd > 24 ? slice.slice(0, wordEnd) : slice.slice(0, limit);
  return `${trimmed.trim()}${suffix}`;
}

function validateNoBannedClaims(story) {
  const combined = `${story.title}\n${story.description}\n${story.body.join("\n")}`.toLowerCase();
  const banned = [
    "confirmed by rockstar",
    "officially confirmed",
    "real leak",
    "genuine leak",
    "take-two source confirmed",
    "rockstar source confirmed"
  ];

  for (const phrase of banned) {
    if (combined.includes(phrase)) {
      throw new Error(`Generated story used banned phrase: ${phrase}`);
    }
  }
}

function hasAutomatedStoryToday(data, todayLabel) {
  return data.stories.some((story) => story.date === todayLabel && story.generatedBy === "auto-rumour-bot");
}

async function createRumours({ count, data }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it as a GitHub Actions repository secret.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const existingTitles = data.stories.slice(0, 12).map((story) => story.title);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You write fictional parody newspaper stories for an unofficial GTA 6 rumour site. Everything must be obviously made up, silly, non-defamatory, non-explicit, and not presented as real inside information. Avoid claiming real leaks, real crimes, real employees, or real confirmations. Return only valid JSON matching the schema."
        },
        {
          role: "user",
          content: JSON.stringify({
            task: `Write ${count} new completely fictional GTA VI parody rumours.`,
            tone:
              "British-ish tabloid deadpan, wacky but readable, funny headlines, no real-world allegations, no genuine leak language.",
            categories: ["leak", "analysis", "local"],
            accents: ["blue", "sunset", "green", "yellow", "red"],
            existingTitles
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "gta6_parody_rumours",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["stories"],
            properties: {
              stories: {
                type: "array",
                minItems: count,
                maxItems: count,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "category",
                    "badge",
                    "accent",
                    "title",
                    "description",
                    "author",
                    "readTime",
                    "body"
                  ],
                  properties: {
                    category: { type: "string", enum: ["leak", "analysis", "local"] },
                    badge: { type: "string", maxLength: 28 },
                    accent: { type: "string", enum: ["blue", "sunset", "green", "yellow", "red"] },
                    title: { type: "string", maxLength: 100 },
                    description: { type: "string", maxLength: 170 },
                    author: { type: "string", maxLength: 42 },
                    readTime: { type: "string" },
                    body: {
                      type: "array",
                      minItems: 3,
                      maxItems: 5,
                      items: { type: "string", maxLength: 650 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed with ${response.status}: ${errorBody}`);
  }

  const responseJson = await response.json();
  const text = getResponseText(responseJson);
  if (!text) {
    throw new Error("OpenAI response did not include JSON text.");
  }

  return JSON.parse(text).stories;
}

async function main() {
  const count = Number.parseInt(process.env.AI_RUMOUR_COUNT || "2", 10);
  if (!Number.isInteger(count) || count < 1 || count > 5) {
    throw new Error("AI_RUMOUR_COUNT must be a number from 1 to 5.");
  }

  const data = readJson(dataPath);
  const todayLabel = formatDate(new Date());

  if (process.env.AI_RUMOUR_SKIP_IF_TODAY === "1" && hasAutomatedStoryToday(data, todayLabel)) {
    console.log(`Automated rumours already published for ${todayLabel}. Skipping.`);
    return;
  }

  const usedSlugs = new Set(data.stories.map((story) => story.slug));
  const generated = await createRumours({ count, data });
  const newStories = generated.map((story) => coerceStory(story, usedSlugs, todayLabel));

  for (const story of newStories) {
    validateNoBannedClaims(story);
  }

  data.updatedLabel = todayLabel;
  data.stories = [...newStories, ...data.stories];
  data.ticker = [
    ...newStories.map((story) => story.title),
    ...data.ticker
  ].slice(0, 8);

  if (process.env.AI_RUMOUR_DRY_RUN === "1") {
    console.log(JSON.stringify(newStories, null, 2));
    return;
  }

  fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Added ${newStories.length} automated parody rumours:`);
  for (const story of newStories) {
    console.log(`- ${story.title}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
