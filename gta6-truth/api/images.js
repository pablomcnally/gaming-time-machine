const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

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
      if (body.length > 8 * 1024 * 1024) {
        reject(new Error("Image upload is too large. Try an image under 3 MB."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    request.on("error", reject);
  });
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable.`);
  return value;
}

function getConfig() {
  return {
    password: requireEnv("EDITOR_PASSWORD"),
    token: requireEnv("GITHUB_TOKEN"),
    repo: process.env.GITHUB_REPO || "pablomcnally/gaming-time-machine",
    branch: process.env.GITHUB_BRANCH || "main",
    imagePath: process.env.GITHUB_IMAGE_PATH || "gta6-truth/assets/story-images",
    committerName: process.env.GITHUB_COMMITTER_NAME || "GTA Truth Editor",
    committerEmail: process.env.GITHUB_COMMITTER_EMAIL || "editor@gta6truth.local"
  };
}

function checkPassword(request, expectedPassword) {
  const suppliedPassword = request.headers["x-editor-password"];
  return typeof suppliedPassword === "string" && suppliedPassword === expectedPassword;
}

function slugify(value) {
  return String(value || "story-image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "story-image";
}

async function githubRequest(url, options, token) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "gta-truth-image-upload",
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

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
    return;
  }

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
    const body = await readBody(request);
    const mimeType = String(body.mimeType || "");
    const extension = allowedTypes.get(mimeType);
    const base64 = String(body.base64 || "");

    if (!extension) {
      sendJson(response, 400, { ok: false, message: "Upload a JPG, PNG, WebP, or GIF image." });
      return;
    }

    const bytes = Buffer.from(base64, "base64");
    if (!bytes.length) {
      sendJson(response, 400, { ok: false, message: "Image file was empty." });
      return;
    }

    if (bytes.length > 3 * 1024 * 1024) {
      sendJson(response, 400, { ok: false, message: "Image is too large. Try under 3 MB." });
      return;
    }

    const storySlug = slugify(body.storySlug);
    const originalName = slugify(String(body.filename || "").replace(/\.[^.]+$/, ""));
    const fileName = `${storySlug}-${Date.now()}-${originalName}.${extension}`;
    const repoPath = `${config.imagePath.replace(/\/+$/, "")}/${fileName}`;
    const publicPath = repoPath.replace(/^gta6-truth\//, "");
    const url = `https://api.github.com/repos/${config.repo}/contents/${repoPath}`;

    const payload = await githubRequest(
      url,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `Upload GTA parody image ${fileName}`,
          content: bytes.toString("base64"),
          branch: config.branch,
          committer: {
            name: config.committerName,
            email: config.committerEmail
          }
        })
      },
      config.token
    );

    sendJson(response, 200, {
      ok: true,
      path: publicPath,
      commitSha: payload.commit.sha
    });
  } catch (error) {
    sendJson(response, 500, { ok: false, message: error.message || "Unexpected server error." });
  }
};
