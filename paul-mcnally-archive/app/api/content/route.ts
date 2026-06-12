import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const editableFiles = {
  home: "data/home.json",
  about: "data/about.json",
  contact: "data/contact.json",
  career: "data/career.json",
  archive: "data/archive.json",
  musings: "data/musings.json"
} as const;

type EditableKey = keyof typeof editableFiles;

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

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validateStringArray(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a list.`);
  }

  return value.map((item) => cleanText(item, 1000)).filter(Boolean);
}

function normalizeHome(value: unknown) {
  const data = value as Record<string, any>;

  return {
    taglineParts: validateStringArray(data.taglineParts, "Home tagline"),
    welcomeTitle: cleanText(data.welcomeTitle, 160),
    introLines: validateStringArray(data.introLines, "Home intro lines"),
    readMoreLabel: cleanText(data.readMoreLabel, 120),
    status: {
      title: cleanText(data.status?.title, 80),
      state: cleanText(data.status?.state, 80),
      user: cleanText(data.status?.user, 80),
      location: cleanText(data.status?.location, 80),
      service: cleanText(data.status?.service, 120)
    },
    latestTitle: cleanText(data.latestTitle, 80),
    latestCounter: cleanText(data.latestCounter, 40),
    latestCtaLabel: cleanText(data.latestCtaLabel, 80),
    selectedWorkTitle: cleanText(data.selectedWorkTitle, 80),
    selectedWorkCounter: cleanText(data.selectedWorkCounter, 40),
    storyStats: normalizeList(data.storyStats, "Story stats", (item, index) => ({
      label: cleanText(item.label, 80) || `Stat ${index + 1}`,
      value: cleanText(item.value, 80)
    }))
  };
}

function normalizeAbout(value: unknown) {
  const data = value as Record<string, any>;

  return {
    eyebrow: cleanText(data.eyebrow, 80),
    title: cleanText(data.title, 120),
    intro: cleanText(data.intro, 700),
    panels: normalizeList(data.panels, "About panels", (item, index) => ({
      title: cleanText(item.title, 80) || `Panel ${index + 1}`,
      tone: ["cyan", "green", "yellow", "red"].includes(item.tone) ? item.tone : "cyan",
      paragraphs: validateStringArray(item.paragraphs, `About panel ${index + 1} paragraphs`)
    }))
  };
}

function normalizeContact(value: unknown) {
  const data = value as Record<string, any>;

  return {
    eyebrow: cleanText(data.eyebrow, 80),
    title: cleanText(data.title, 120),
    intro: cleanText(data.intro, 700),
    panelTitle: cleanText(data.panelTitle, 100),
    panelBody: cleanText(data.panelBody, 900),
    links: normalizeList(data.links, "Contact links", (item, index) => ({
      label: cleanText(item.label, 120) || `Link ${index + 1}`,
      href: cleanText(item.href, 300)
    })),
    formAction: cleanText(data.formAction, 300)
  };
}

function normalizeCareer(value: unknown) {
  return normalizeList(value, "Career entries", (item) => ({
    year: cleanText(item.year, 20),
    range: cleanText(item.range, 80),
    role: cleanText(item.role, 160),
    company: cleanText(item.company, 160),
    description: cleanText(item.description, 900),
    image: cleanText(item.image, 300),
    link: cleanText(item.link, 300) || undefined
  }));
}

function normalizeArchive(value: unknown) {
  return normalizeList(value, "Archive items", (item) => ({
    image: cleanText(item.image, 300),
    title: cleanText(item.title, 160),
    caption: cleanText(item.caption, 900),
    year: cleanText(item.year, 40),
    category: ["magazines", "websites", "events", "press", "retro"].includes(item.category) ? item.category : "press",
    publication: cleanText(item.publication, 160),
    externalLink: cleanText(item.externalLink, 300) || undefined
  }));
}

function normalizeMusings(value: unknown) {
  return normalizeList(value, "Musings", (item, index) => {
    const title = cleanText(item.title, 140);

    return {
      id: cleanText(item.id, 90) || `musing-${Date.now()}-${index}`,
      title,
      date: /^\d{4}-\d{2}-\d{2}$/.test(cleanText(item.date, 20)) ? cleanText(item.date, 20) : new Date().toISOString().slice(0, 10),
      category: cleanText(item.category, 60) || "Musing",
      body: cleanText(item.body, 900),
      href: cleanText(item.href, 180)
    };
  });
}

function normalizeList<T>(value: unknown, label: string, normalizeItem: (item: Record<string, any>, index: number) => T) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a list.`);
  }

  return value.map((item, index) => normalizeItem((item || {}) as Record<string, any>, index));
}

function normalizeContent(content: Record<string, unknown>) {
  return {
    home: normalizeHome(content.home),
    about: normalizeAbout(content.about),
    contact: normalizeContact(content.contact),
    career: normalizeCareer(content.career),
    archive: normalizeArchive(content.archive),
    musings: normalizeMusings(content.musings)
  };
}

async function readLocalContent() {
  const entries = await Promise.all(
    Object.entries(editableFiles).map(async ([key, filePath]) => {
      const content = await fs.readFile(path.join(process.cwd(), filePath), "utf8");
      return [key, JSON.parse(content)] as const;
    })
  );

  return Object.fromEntries(entries) as Record<EditableKey, unknown>;
}

async function writeLocalContent(content: Record<EditableKey, unknown>) {
  try {
    await Promise.all(
      Object.entries(editableFiles).map(async ([key, filePath]) => {
        await fs.writeFile(path.join(process.cwd(), filePath), `${JSON.stringify(content[key as EditableKey], null, 2)}\n`, "utf8");
      })
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EPERM") {
      throw new Error("Local preview could not write JSON files. Use GitHub-backed saves on Vercel.");
    }

    throw error;
  }
}

async function githubRequest(url: string, options: RequestInit, token: string) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "paul-archive-content-editor",
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

async function readGithubFile(config: GithubConfig & { token: string }, filePath: string) {
  const url = `https://api.github.com/repos/${config.repo}/contents/paul-mcnally-archive/${filePath}?ref=${config.branch}`;
  const payload = await githubRequest(url, { method: "GET" }, config.token);
  const content = Buffer.from(typeof payload.content === "string" ? payload.content : "", "base64").toString("utf8");

  return {
    data: JSON.parse(content),
    sha: String(payload.sha || "")
  };
}

async function writeGithubFile(config: GithubConfig & { token: string }, filePath: string, data: unknown, sha: string) {
  const url = `https://api.github.com/repos/${config.repo}/contents/paul-mcnally-archive/${filePath}`;
  const content = Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64");
  const payload = await githubRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `Update Paul archive ${filePath}`,
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

  return payload.commit as { sha?: string; html_url?: string };
}

async function readGithubContent(config: GithubConfig & { token: string }) {
  const entries = await Promise.all(
    Object.entries(editableFiles).map(async ([key, filePath]) => {
      const file = await readGithubFile(config, filePath);
      return [key, file.data] as const;
    })
  );

  return Object.fromEntries(entries) as Record<EditableKey, unknown>;
}

async function writeGithubContent(config: GithubConfig & { token: string }, content: Record<EditableKey, unknown>) {
  const commits = [];

  for (const [key, filePath] of Object.entries(editableFiles)) {
    const file = await readGithubFile(config, filePath);
    const commit = await writeGithubFile(config, filePath, content[key as EditableKey], file.sha);
    commits.push(commit);
  }

  return commits;
}

export async function GET(request: NextRequest) {
  if (!checkPassword(request)) {
    return sendJson(401, { ok: false, message: "Incorrect editor password." });
  }

  try {
    const config = getGithubConfig();
    const content = config.token
      ? await readGithubContent(config as GithubConfig & { token: string })
      : await readLocalContent();

    return sendJson(200, {
      ok: true,
      mode: config.token ? "github" : "local",
      content: normalizeContent(content)
    });
  } catch (error) {
    return sendJson(500, { ok: false, message: error instanceof Error ? error.message : "Could not load content." });
  }
}

export async function POST(request: NextRequest) {
  if (!checkPassword(request)) {
    return sendJson(401, { ok: false, message: "Incorrect editor password." });
  }

  try {
    const body = (await request.json()) as { content?: Record<string, unknown> };
    const content = normalizeContent(body.content || {});
    const config = getGithubConfig();

    if (config.token) {
      const commits = await writeGithubContent(config as GithubConfig & { token: string }, content);
      return sendJson(200, {
        ok: true,
        mode: "github",
        message: "Content saved to GitHub.",
        commitSha: commits.at(-1)?.sha,
        commitCount: commits.length
      });
    }

    await writeLocalContent(content);
    return sendJson(200, {
      ok: true,
      mode: "local",
      message: "Content saved locally. Rebuild or restart to see static output update."
    });
  } catch (error) {
    return sendJson(500, { ok: false, message: error instanceof Error ? error.message : "Could not save content." });
  }
}
