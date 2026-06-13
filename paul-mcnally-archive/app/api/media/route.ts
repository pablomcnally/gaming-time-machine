import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const archivePublicPath = "public/archive";
const uploadPublicPath = "public/archive/uploads";
const allowedMimeTypes = new Map([
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/svg+xml", "svg"],
  ["image/webp", "webp"]
]);
const maxUploadBytes = 4 * 1024 * 1024;

type GithubConfig = {
  branch: string;
  committerEmail: string;
  committerName: string;
  repo: string;
  token?: string;
};

function sendJson(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

function getPassword() {
  return process.env.EDITOR_PASSWORD || "local-preview";
}

function checkPassword(request: NextRequest) {
  return request.headers.get("x-editor-password") === getPassword();
}

function getGithubConfig(): GithubConfig {
  return {
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPO || "pablomcnally/gaming-time-machine",
    branch: process.env.GITHUB_BRANCH || "main",
    committerName: process.env.GITHUB_COMMITTER_NAME || "Paul Archive Editor",
    committerEmail: process.env.GITHUB_COMMITTER_EMAIL || "editor@paul-archive.local"
  };
}

function slugifyFileName(value: string) {
  const parsed = path.parse(value);
  const baseName = parsed.name || "archive-image";

  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "archive-image";
}

function imagePathFromRepoPath(repoPath: string) {
  return `/${repoPath.replace(/^paul-mcnally-archive\/public\//, "").replace(/^public\//, "").replace(/\\/g, "/")}`;
}

function isArchiveImage(filePath: string) {
  return /\.(gif|jpe?g|png|svg|webp)$/i.test(filePath) && filePath.includes("/archive/");
}

async function githubRequest(url: string, options: RequestInit, token: string) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "paul-archive-media-editor",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof payload.message === "string" ? payload.message : `GitHub request failed with ${response.status}.`);
  }

  return payload;
}

async function listLocalImages() {
  const root = path.join(process.cwd(), archivePublicPath);
  const files: string[] = [];

  async function walk(directory: string) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
      } else {
        const relativePath = path.relative(path.join(process.cwd(), "public"), entryPath).replace(/\\/g, "/");

        if (isArchiveImage(`/${relativePath}`)) {
          files.push(`/${relativePath}`);
        }
      }
    }
  }

  await walk(root);
  return files.sort();
}

async function getGithubTreeSha(config: GithubConfig & { token: string }) {
  const refUrl = `https://api.github.com/repos/${config.repo}/git/ref/heads/${config.branch}`;
  const ref = await githubRequest(refUrl, { method: "GET" }, config.token);
  const commitSha = String(ref.object?.sha || "");
  const commitUrl = `https://api.github.com/repos/${config.repo}/git/commits/${commitSha}`;
  const commit = await githubRequest(commitUrl, { method: "GET" }, config.token);

  return String(commit.tree?.sha || "");
}

async function listGithubImages(config: GithubConfig & { token: string }) {
  const treeSha = await getGithubTreeSha(config);
  const url = `https://api.github.com/repos/${config.repo}/git/trees/${treeSha}?recursive=1`;
  const payload = await githubRequest(url, { method: "GET" }, config.token);
  const tree = Array.isArray(payload.tree) ? payload.tree : [];

  return tree
    .filter((item: any) => item.type === "blob" && typeof item.path === "string")
    .map((item: any) => String(item.path))
    .filter((filePath: string) => filePath.startsWith("paul-mcnally-archive/public/archive/") && isArchiveImage(filePath))
    .map(imagePathFromRepoPath)
    .sort();
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Upload must be a base64 image data URL.");
  }

  const mimeType = match[1].toLowerCase();
  const extension = allowedMimeTypes.get(mimeType);

  if (!extension) {
    throw new Error("Use PNG, JPG, WebP, GIF, or SVG images.");
  }

  const buffer = Buffer.from(match[2], "base64");

  if (buffer.byteLength > maxUploadBytes) {
    throw new Error("Image uploads must be 4MB or smaller.");
  }

  return { buffer, extension, mimeType };
}

function buildUploadPath(fileName: string, extension: string) {
  const slug = slugifyFileName(fileName);
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

  return {
    publicPath: `/archive/uploads/${slug}-${stamp}.${extension}`,
    repoPath: `paul-mcnally-archive/${uploadPublicPath}/${slug}-${stamp}.${extension}`
  };
}

async function writeLocalImage(fileName: string, dataUrl: string) {
  const { buffer, extension } = decodeDataUrl(dataUrl);
  const uploadPath = buildUploadPath(fileName, extension);
  const absoluteDirectory = path.join(process.cwd(), uploadPublicPath);
  const absolutePath = path.join(process.cwd(), uploadPath.repoPath.replace(/^paul-mcnally-archive\//, ""));

  await fs.mkdir(absoluteDirectory, { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return uploadPath.publicPath;
}

async function writeGithubImage(config: GithubConfig & { token: string }, fileName: string, dataUrl: string) {
  const { buffer, extension } = decodeDataUrl(dataUrl);
  const uploadPath = buildUploadPath(fileName, extension);
  const url = `https://api.github.com/repos/${config.repo}/contents/${uploadPath.repoPath}`;

  await githubRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `Upload Paul archive image ${path.basename(uploadPath.publicPath)}`,
        branch: config.branch,
        content: buffer.toString("base64"),
        committer: {
          name: config.committerName,
          email: config.committerEmail
        }
      })
    },
    config.token
  );

  return uploadPath.publicPath;
}

export async function GET(request: NextRequest) {
  if (!checkPassword(request)) {
    return sendJson(401, { ok: false, message: "Incorrect editor password." });
  }

  try {
    const config = getGithubConfig();
    const images = config.token ? await listGithubImages(config as GithubConfig & { token: string }) : await listLocalImages();

    return sendJson(200, {
      ok: true,
      mode: config.token ? "github" : "local",
      images
    });
  } catch (error) {
    return sendJson(500, { ok: false, message: error instanceof Error ? error.message : "Could not load archive images." });
  }
}

export async function POST(request: NextRequest) {
  if (!checkPassword(request)) {
    return sendJson(401, { ok: false, message: "Incorrect editor password." });
  }

  try {
    const body = (await request.json()) as { dataUrl?: string; fileName?: string };

    if (!body.dataUrl || !body.fileName) {
      throw new Error("Choose an image file to upload.");
    }

    const config = getGithubConfig();
    const imagePath = config.token
      ? await writeGithubImage(config as GithubConfig & { token: string }, body.fileName, body.dataUrl)
      : await writeLocalImage(body.fileName, body.dataUrl);

    return sendJson(200, {
      ok: true,
      mode: config.token ? "github" : "local",
      imagePath
    });
  } catch (error) {
    return sendJson(500, { ok: false, message: error instanceof Error ? error.message : "Could not upload archive image." });
  }
}
