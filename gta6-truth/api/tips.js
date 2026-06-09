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
      if (body.length > 256 * 1024) {
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
    tipsPath: process.env.GITHUB_TIPS_PATH || "gta6-truth/data/tips.json",
    committerName: process.env.GITHUB_COMMITTER_NAME || "GTA Truth Editor",
    committerEmail: process.env.GITHUB_COMMITTER_EMAIL || "editor@gta6truth.local"
  };
}

function checkPassword(request, expectedPassword) {
  const suppliedPassword = request.headers["x-editor-password"];
  return typeof suppliedPassword === "string" && suppliedPassword === expectedPassword;
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validateTip(value) {
  const alias = cleanText(value.alias, 80) || "Anonymous source";
  const rumour = cleanText(value.rumour, 1200);

  if (!rumour || rumour.length < 8) {
    throw new Error("Tip needs a little more detail.");
  }

  return {
    id: `tip-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    alias,
    rumour,
    createdAt: new Date().toISOString(),
    status: "new"
  };
}

function validateTipList(value) {
  if (!Array.isArray(value)) {
    throw new Error("Tips must be an array.");
  }

  return value.map((tip, index) => {
    const id = cleanText(tip.id, 80);
    const alias = cleanText(tip.alias, 80) || "Anonymous source";
    const rumour = cleanText(tip.rumour, 1200);
    const createdAt = cleanText(tip.createdAt, 40);
    const status = cleanText(tip.status, 40) || "new";

    if (!id) throw new Error(`Tip ${index + 1} is missing an id.`);
    if (!rumour) throw new Error(`Tip ${index + 1} is missing rumour text.`);

    return { id, alias, rumour, createdAt, status };
  });
}

async function githubRequest(url, options, token) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "gta-truth-tipline",
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
  const url = `https://api.github.com/repos/${config.repo}/contents/${config.tipsPath}?ref=${config.branch}`;

  try {
    const payload = await githubRequest(url, { method: "GET" }, config.token);
    const content = Buffer.from(payload.content || "", "base64").toString("utf8");
    return {
      data: JSON.parse(content),
      sha: payload.sha
    };
  } catch (error) {
    if (error.message === "Not Found") {
      return { data: [], sha: null };
    }
    throw error;
  }
}

async function writeGithubFile(config, tips, sha, message) {
  const url = `https://api.github.com/repos/${config.repo}/contents/${config.tipsPath}`;
  const content = Buffer.from(`${JSON.stringify(tips, null, 2)}\n`, "utf8").toString("base64");
  const body = {
    message,
    content,
    branch: config.branch,
    committer: {
      name: config.committerName,
      email: config.committerEmail
    }
  };

  if (sha) {
    body.sha = sha;
  }

  const payload = await githubRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify(body)
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

  try {
    if (request.method === "POST") {
      const body = await readBody(request);

      if (body.website) {
        sendJson(response, 200, { ok: true, message: "Tip filed." });
        return;
      }

      const tip = validateTip(body);
      const currentFile = await readGithubFile(config);
      const currentTips = validateTipList(currentFile.data);
      currentTips.unshift(tip);
      const commit = await writeGithubFile(config, currentTips, currentFile.sha, "Add GTA parody tip");
      sendJson(response, 200, {
        ok: true,
        message: "Tip filed.",
        tip,
        commitSha: commit.sha
      });
      return;
    }

    if (!checkPassword(request, config.password)) {
      sendJson(response, 401, { ok: false, message: "Incorrect editor password." });
      return;
    }

    if (request.method === "GET") {
      const currentFile = await readGithubFile(config);
      sendJson(response, 200, {
        ok: true,
        tips: validateTipList(currentFile.data)
      });
      return;
    }

    if (request.method === "PUT") {
      const body = await readBody(request);
      const tips = validateTipList(body.tips);
      const currentFile = await readGithubFile(config);
      const commit = await writeGithubFile(config, tips, currentFile.sha, "Update GTA parody tips");
      sendJson(response, 200, {
        ok: true,
        message: "Tips updated.",
        commitSha: commit.sha
      });
      return;
    }

    response.setHeader("Allow", "GET, POST, PUT");
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
  } catch (error) {
    sendJson(response, 500, { ok: false, message: error.message || "Unexpected server error." });
  }
};
