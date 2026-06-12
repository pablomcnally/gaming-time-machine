import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import type { Musing } from "../../../lib/musings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GithubConfig = {
  branch: string;
  committerEmail: string;
  committerName: string;
  contentPath: string;
  repo: string;
  token?: string;
};

const localMusingsPath = path.join(process.cwd(), "data", "musings.json");

function sendJson(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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
    contentPath: process.env.GITHUB_MUSINGS_PATH || "paul-mcnally-archive/data/musings.json",
    committerName: process.env.GITHUB_COMMITTER_NAME || "Paul Archive Editor",
    committerEmail: process.env.GITHUB_COMMITTER_EMAIL || "editor@paul-archive.local"
  };
}

function normalizeMusings(value: unknown): Musing[] {
  if (!Array.isArray(value)) {
    throw new Error("Musings must be an array.");
  }

  const ids = new Set<string>();

  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Musing ${index + 1} must be an object.`);
    }

    const record = item as Record<string, unknown>;
    const title = cleanText(record.title, 140);
    const id = cleanText(record.id, 90) || slugify(title) || `musing-${Date.now()}-${index}`;
    const date = cleanText(record.date, 20);
    const category = cleanText(record.category, 60) || "Musing";
    const body = cleanText(record.body, 900);
    const href = cleanText(record.href, 180);

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`Musing ${index + 1} has an invalid id.`);
    }

    if (ids.has(id)) {
      throw new Error(`Duplicate musing id: ${id}.`);
    }

    ids.add(id);

    if (!title) {
      throw new Error(`Musing ${index + 1} needs a title.`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Musing ${index + 1} needs a date like 2026-06-12.`);
    }

    if (!body) {
      throw new Error(`Musing ${index + 1} needs body text.`);
    }

    return {
      id,
      title,
      date,
      category,
      body,
      href
    };
  });
}

async function githubRequest(url: string, options: RequestInit, token: string) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "paul-archive-editor",
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

async function readGithubFile(config: GithubConfig & { token: string }) {
  const url = `https://api.github.com/repos/${config.repo}/contents/${config.contentPath}?ref=${config.branch}`;
  const payload = await githubRequest(url, { method: "GET" }, config.token);
  const encodedContent = typeof payload.content === "string" ? payload.content : "";
  const content = Buffer.from(encodedContent, "base64").toString("utf8");

  return {
    data: normalizeMusings(JSON.parse(content)),
    sha: String(payload.sha || "")
  };
}

async function writeGithubFile(config: GithubConfig & { token: string }, musings: Musing[], sha: string) {
  const url = `https://api.github.com/repos/${config.repo}/contents/${config.contentPath}`;
  const content = Buffer.from(`${JSON.stringify(musings, null, 2)}\n`, "utf8").toString("base64");
  const payload = await githubRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify({
        message: "Update Paul archive musings",
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

  return payload.commit as { html_url?: string; sha?: string };
}

async function readLocalFile() {
  const content = await fs.readFile(localMusingsPath, "utf8");

  return normalizeMusings(JSON.parse(content));
}

async function writeLocalFile(musings: Musing[]) {
  try {
    await fs.writeFile(localMusingsPath, `${JSON.stringify(musings, null, 2)}\n`, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EPERM") {
      throw new Error("Local preview could not write data/musings.json. Use GitHub-backed saves on Vercel.");
    }

    throw error;
  }
}

export async function GET(request: NextRequest) {
  if (!checkPassword(request)) {
    return sendJson(401, { ok: false, message: "Incorrect editor password." });
  }

  try {
    const config = getGithubConfig();

    if (config.token) {
      const file = await readGithubFile(config as GithubConfig & { token: string });
      return sendJson(200, { ok: true, data: file.data, mode: "github" });
    }

    const data = await readLocalFile();
    return sendJson(200, { ok: true, data, mode: "local" });
  } catch (error) {
    return sendJson(500, { ok: false, message: error instanceof Error ? error.message : "Could not load musings." });
  }
}

export async function POST(request: NextRequest) {
  if (!checkPassword(request)) {
    return sendJson(401, { ok: false, message: "Incorrect editor password." });
  }

  try {
    const body = (await request.json()) as { musings?: unknown };
    const musings = normalizeMusings(body.musings);
    const config = getGithubConfig();

    if (config.token) {
      const file = await readGithubFile(config as GithubConfig & { token: string });
      const commit = await writeGithubFile(config as GithubConfig & { token: string }, musings, file.sha);
      return sendJson(200, {
        ok: true,
        mode: "github",
        message: "Saved to GitHub.",
        commitSha: commit.sha,
        commitUrl: commit.html_url
      });
    }

    await writeLocalFile(musings);
    return sendJson(200, {
      ok: true,
      mode: "local",
      message: "Saved locally. Restart or rebuild the site to publish static pages."
    });
  } catch (error) {
    return sendJson(500, { ok: false, message: error instanceof Error ? error.message : "Could not save musings." });
  }
}
