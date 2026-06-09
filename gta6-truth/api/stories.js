const allowedCategories = new Set(["leak", "analysis", "local"]);
const allowedAccents = new Set(["blue", "yellow", "green", "red", "sunset"]);

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    request.on("error", reject);
  });
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function getConfig() {
  return {
    password: requireEnv("EDITOR_PASSWORD"),
    token: requireEnv("GITHUB_TOKEN"),
    repo: process.env.GITHUB_REPO || "pablomcnally/gaming-time-machine",
    branch: process.env.GITHUB_BRANCH || "main",
    contentPath: process.env.GITHUB_CONTENT_PATH || "gta6-truth/data/stories.json",
    committerName: process.env.GITHUB_COMMITTER_NAME || "GTA Truth Editor",
    committerEmail: process.env.GITHUB_COMMITTER_EMAIL || "editor@gta6truth.local"
  };
}

function checkPassword(request, expectedPassword) {
  const suppliedPassword = request.headers["x-editor-password"];
  return typeof suppliedPassword === "string" && suppliedPassword === expectedPassword;
}

function validateText(value, path, errors) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${path} is required.`);
  }
}

function validateOptionalText(value, path, errors) {
  if (value !== undefined && typeof value !== "string") {
    errors.push(`${path} must be text when provided.`);
  }
}

function validateStoriesData(value) {
  const errors = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["Story data must be an object."];
  }

  validateText(value.updatedLabel, "updatedLabel", errors);
  validateText(value.lead?.label, "lead.label", errors);
  validateText(value.lead?.title, "lead.title", errors);
  validateText(value.lead?.summary, "lead.summary", errors);

  if (!Array.isArray(value.ticker) || value.ticker.length === 0) {
    errors.push("ticker must contain at least one line.");
  } else {
    value.ticker.forEach((line, index) => validateText(line, `ticker[${index}]`, errors));
  }

  if (!Array.isArray(value.stories) || value.stories.length === 0) {
    errors.push("stories must contain at least one story.");
    return errors;
  }

  const slugs = new Set();
  value.stories.forEach((story, index) => {
    const path = `stories[${index}]`;
    if (!story || typeof story !== "object" || Array.isArray(story)) {
      errors.push(`${path} must be an object.`);
      return;
    }

    validateText(story.slug, `${path}.slug`, errors);
    if (typeof story.slug === "string" && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(story.slug)) {
      errors.push(`${path}.slug must use lowercase letters, numbers, and hyphens.`);
    }
    if (slugs.has(story.slug)) {
      errors.push(`${path}.slug is duplicated.`);
    }
    slugs.add(story.slug);

    validateText(story.category, `${path}.category`, errors);
    if (!allowedCategories.has(story.category)) {
      errors.push(`${path}.category must be leak, analysis, or local.`);
    }

    validateText(story.accent, `${path}.accent`, errors);
    if (!allowedAccents.has(story.accent)) {
      errors.push(`${path}.accent is not supported.`);
    }

    for (const field of ["categoryLabel", "badge", "title", "description", "author", "readTime", "date"]) {
      validateText(story[field], `${path}.${field}`, errors);
    }

    validateOptionalText(story.imageUrl, `${path}.imageUrl`, errors);
    validateOptionalText(story.imageAlt, `${path}.imageAlt`, errors);

    if (!Array.isArray(story.body) || story.body.length === 0) {
      errors.push(`${path}.body must contain at least one paragraph.`);
    } else {
      story.body.forEach((paragraph, paragraphIndex) => {
        validateText(paragraph, `${path}.body[${paragraphIndex}]`, errors);
      });
    }
  });

  return errors;
}

function normalizeStoriesData(value) {
  return {
    updatedLabel: value.updatedLabel.trim(),
    lead: {
      label: value.lead.label.trim(),
      title: value.lead.title.trim(),
      summary: value.lead.summary.trim()
    },
    ticker: value.ticker.map((line) => line.trim()),
    stories: value.stories.map((story) => ({
      slug: story.slug.trim(),
      category: story.category.trim(),
      categoryLabel: story.categoryLabel.trim(),
      badge: story.badge.trim(),
      accent: story.accent.trim(),
      title: story.title.trim(),
      description: story.description.trim(),
      imageUrl: (story.imageUrl || "").trim(),
      imageAlt: (story.imageAlt || "").trim(),
      author: story.author.trim(),
      readTime: story.readTime.trim(),
      date: story.date.trim(),
      body: story.body.map((paragraph) => paragraph.trim())
    }))
  };
}

async function githubRequest(url, options, token) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "gta-truth-editor",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || `GitHub request failed with ${response.status}.`);
  }

  return payload;
}

async function readGithubFile(config) {
  const url = `https://api.github.com/repos/${config.repo}/contents/${config.contentPath}?ref=${config.branch}`;
  const payload = await githubRequest(url, { method: "GET" }, config.token);
  const content = Buffer.from(payload.content || "", "base64").toString("utf8");
  return {
    data: JSON.parse(content),
    sha: payload.sha
  };
}

async function writeGithubFile(config, data, sha) {
  const url = `https://api.github.com/repos/${config.repo}/contents/${config.contentPath}`;
  const content = Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64");
  const payload = await githubRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify({
        message: "Update GTA parody stories",
        content,
        sha,
        branch: config.branch,
        committer: {
          name: config.committerName,
          email: config.committerEmail
        }
      })
    },
    config.token
  );

  return payload.commit;
}

module.exports = async function handler(request, response) {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    sendJson(response, 500, { ok: false, message: error.message });
    return;
  }

  if (!checkPassword(request, config.password)) {
    sendJson(response, 401, { ok: false, message: "Incorrect editor password." });
    return;
  }

  try {
    if (request.method === "GET") {
      const file = await readGithubFile(config);
      sendJson(response, 200, { ok: true, data: file.data, sha: file.sha });
      return;
    }

    if (request.method === "POST") {
      const body = await readBody(request);
      const errors = validateStoriesData(body.data);
      if (errors.length) {
        sendJson(response, 400, { ok: false, message: errors[0], errors });
        return;
      }

      const normalizedData = normalizeStoriesData(body.data);
      const currentFile = await readGithubFile(config);
      const commit = await writeGithubFile(config, normalizedData, currentFile.sha);
      sendJson(response, 200, {
        ok: true,
        message: "Saved to GitHub.",
        commitSha: commit.sha,
        commitUrl: commit.html_url
      });
      return;
    }

    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
  } catch (error) {
    sendJson(response, 500, { ok: false, message: error.message || "Unexpected server error." });
  }
};
