const fs = require("fs");
const path = require("path");

const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "stories.json"), "utf8"));
const storyDir = path.join(root, "stories");

const categoryLabels = {
  all: "All",
  leak: "Leaks",
  analysis: "Analysis",
  local: "Local chaos"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pageShell({ title, description, basePath, bodyClass = "", main }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const base = basePath ? `${basePath}/` : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${safeDescription}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="${base}styles.css" />
  </head>
  <body class="${bodyClass}">
    ${siteHeader(basePath)}
    ${main}
    ${siteFooter()}
    <script type="application/json" id="tickerData">${JSON.stringify(data.ticker)}</script>
    <script src="${base}script.js"></script>
  </body>
</html>
`;
}

function siteHeader(basePath) {
  const base = basePath ? `${basePath}/` : "";
  const home = basePath ? `${base}index.html` : "#";

  return `<header class="site-header">
      <div class="topline">
        <span>Unofficial parody edition</span>
        <span>${escapeHtml(data.updatedLabel)}</span>
        <span>Truth level: heavily caffeinated</span>
      </div>
      <nav class="masthead" aria-label="Primary">
        <a class="brand" href="${home}" aria-label="GTA 6 - Nothing but the truth home">
          <span class="brand-kicker">GTA 6</span>
          <span class="brand-name">Nothing but the truth</span>
        </a>
        <div class="nav-links">
          <a href="${base}index.html#lead">Lead story</a>
          <a href="${base}index.html#latest">Latest</a>
          <a href="${base}index.html#evidence">Evidence</a>
          <a href="${base}index.html#tipline">Tip line</a>
        </div>
      </nav>
      <div class="ticker" aria-label="Breaking rumours">
        <strong>Breaking:</strong>
        <span id="tickerText">${escapeHtml(data.ticker[0])}</span>
      </div>
    </header>`;
}

function siteFooter() {
  return `<footer class="site-footer">
      <p>
        GTA 6 - Nothing but the truth is an unofficial parody site. It is not affiliated with,
        endorsed by, or speaking for Rockstar Games or Take-Two Interactive.
      </p>
    </footer>`;
}

function storyUrl(story, basePath = "") {
  const base = basePath ? `${basePath}/` : "";
  return `${base}stories/${story.slug}/`;
}

function storyImageSrc(story, basePath = "") {
  if (!story.imageUrl) return "";
  if (/^https?:\/\//.test(story.imageUrl) || story.imageUrl.startsWith("/")) return story.imageUrl;
  const base = basePath ? `${basePath}/` : "";
  return `${base}${story.imageUrl}`;
}

function storyCard(story, isLead = false) {
  const articleClass = isLead ? "lead-article story-card" : "story-card";
  const imageSrc = storyImageSrc(story);
  const imageMarkup = imageSrc
    ? `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(story.imageAlt || "")}" loading="lazy" />`
    : "";
  const imageClass = imageSrc ? " has-image" : "";

  return `<article class="${articleClass}" data-category="${escapeHtml(story.category)}">
            <a class="story-art ${escapeHtml(story.accent)}${imageClass}" href="${storyUrl(story)}" aria-label="${escapeHtml(story.title)}">
              ${imageMarkup}
              <span>${escapeHtml(story.badge)}</span>
            </a>
            <div>
              <p class="tag">${escapeHtml(story.categoryLabel)}</p>
              <h3><a href="${storyUrl(story)}">${escapeHtml(story.title)}</a></h3>
              <p>${escapeHtml(story.description)}</p>
              <div class="meta">
                <span>By ${escapeHtml(story.author)}</span>
                <span>${escapeHtml(story.readTime)}</span>
              </div>
            </div>
          </article>`;
}

function renderIndex() {
  const [leadStory, ...otherStories] = data.stories;
  const filters = Object.entries(categoryLabels)
    .map(([key, label], index) => {
      const active = index === 0 ? " active" : "";
      return `<button class="filter-button${active}" type="button" data-filter="${key}">${escapeHtml(label)}</button>`;
    })
    .join("\n            ");

  const main = `<main>
      <section class="hero" id="lead" aria-labelledby="hero-title">
        <img src="assets/neon-rumor-desk-clean.png" alt="A neon coastal city and messy newsroom desk full of rumour files" />
        <div class="hero-copy">
          <p class="label">${escapeHtml(data.lead.label)}</p>
          <h1 id="hero-title">${escapeHtml(data.lead.title)}</h1>
          <p>${escapeHtml(data.lead.summary)}</p>
          <a class="button-link" href="#latest">Read the latest nonsense</a>
        </div>
        <a class="scroll-cue" href="#latest" aria-label="Scroll to latest stories">
          <span>Latest stories</span>
          <span class="scroll-arrow" aria-hidden="true">↓</span>
        </a>
      </section>

      <section class="issue-strip" aria-label="Today's issue summary">
        <div>
          <span class="issue-number">Issue 006</span>
          <strong>Special investigation:</strong> The trailer pause-button industrial complex
        </div>
        <div>
          <strong>Corrections:</strong> Yesterday's "confirmed submarine heist" was a bus stop.
        </div>
      </section>

      <section class="layout-shell" id="latest">
        <div class="content-column">
          <div class="section-heading">
            <p class="label">Latest dispatches</p>
            <h2>News stories with a straight face and no legal confidence</h2>
          </div>

          <div class="filters" aria-label="Story filters">
            ${filters}
          </div>

          ${storyCard(leadStory, true)}

          <div class="story-grid">
            ${otherStories.map((story) => storyCard(story)).join("\n")}
          </div>
        </div>

        <aside class="sidebar" id="evidence" aria-label="Evidence desk">
          <section class="side-panel">
            <p class="label">Evidence desk</p>
            <h2>Rumour reliability meter</h2>
            <div class="meter">
              <span style="width: 18%"></span>
            </div>
            <p>
              Today's confidence rating is based on vibes, compression artifacts, and a receipt
              that says "sandwich".
            </p>
          </section>

          <section class="side-panel">
            <p class="label">Most cited evidence</p>
            <ol class="evidence-list">
              <li>A reflection in a car door</li>
              <li>Two pixels that look like a jet ski</li>
              <li>The phrase "soon" in a forum post from 2019</li>
              <li>A spreadsheet named FINAL_final_REAL.xlsx</li>
            </ol>
          </section>

          <section class="side-panel" id="tipline">
            <p class="label">Send a tip</p>
            <h2>Got proof?</h2>
            <form class="tip-form">
              <label>
                Alias
                <input name="alias" type="text" placeholder="DefinitelyNotAnInsider" />
              </label>
              <label>
                Rumour
                <textarea name="rumour" placeholder="I saw a menu icon shaped like my uncle's boat." required></textarea>
              </label>
              <label class="screen-reader-field">
                Leave this blank
                <input name="website" type="text" tabindex="-1" autocomplete="off" />
              </label>
              <button type="submit">Submit to the filing cabinet</button>
              <p class="form-note" role="status" aria-live="polite"></p>
            </form>
          </section>
        </aside>
      </section>
    </main>`;

  return pageShell({
    title: "GTA 6 - Nothing but the truth",
    description: "GTA 6 - Nothing but the truth, an unofficial parody rumour newspaper.",
    basePath: "",
    main
  });
}

function renderStory(story) {
  const related = data.stories
    .filter((item) => item.slug !== story.slug)
    .slice(0, 3)
    .map((item) => `<li><a href="../${escapeHtml(item.slug)}/">${escapeHtml(item.title)}</a></li>`)
    .join("\n                ");
  const body = story.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n            ");
  const articleImageSrc = storyImageSrc(story, "../..");
  const articleImage = articleImageSrc
    ? `<figure class="article-image">
              <img src="${escapeHtml(articleImageSrc)}" alt="${escapeHtml(story.imageAlt || story.title)}" />
            </figure>`
    : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    description: story.description,
    datePublished: story.date,
    author: {
      "@type": "Person",
      name: story.author
    },
    isAccessibleForFree: true
  };

  const main = `<main>
      <article class="article-page">
        <header class="article-hero">
          <p class="label">${escapeHtml(story.categoryLabel)}</p>
          <h1>${escapeHtml(story.title)}</h1>
          <p class="article-deck">${escapeHtml(story.description)}</p>
          <div class="meta article-meta">
            <span>By ${escapeHtml(story.author)}</span>
            <span>${escapeHtml(story.date)}</span>
            <span>${escapeHtml(story.readTime)}</span>
          </div>
        </header>

        <div class="article-layout">
          <div class="article-body">
            ${articleImage}
            ${body}
          </div>

          <aside class="article-sidebar" aria-label="Story sidebar">
            <section class="side-panel">
              <p class="label">Filed under</p>
              <h2>${escapeHtml(story.badge)}</h2>
              <p>This report has been checked against our strongest editorial standards: vibes, panic, and page views.</p>
            </section>
            <section class="side-panel">
              <p class="label">Read next</p>
              <ol class="evidence-list">
                ${related}
              </ol>
            </section>
          </aside>
        </div>
      </article>
      <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    </main>`;

  return pageShell({
    title: `${story.title} | GTA 6 - Nothing but the truth`,
    description: story.description,
    basePath: "../..",
    bodyClass: "article-template",
    main
  });
}

function build() {
  fs.rmSync(storyDir, { recursive: true, force: true });
  fs.mkdirSync(storyDir, { recursive: true });
  fs.writeFileSync(path.join(root, "index.html"), renderIndex());

  for (const story of data.stories) {
    const dir = path.join(storyDir, story.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderStory(story));
  }

  fs.writeFileSync(
    path.join(storyDir, "stories.json"),
    JSON.stringify(
      data.stories.map((story) => ({
        title: story.title,
        url: `/stories/${story.slug}/`,
        description: story.description,
        imageUrl: story.imageUrl || ""
      })),
      null,
      2
    )
  );

  console.log(`Built ${data.stories.length} stories.`);
}

build();
