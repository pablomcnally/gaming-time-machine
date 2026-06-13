import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postsDirectory = "content/posts";

type EditablePost = {
  body: string;
  category: string;
  date: string;
  excerpt: string;
  featuredImage: string;
  fileName?: string;
  originalSlug?: string;
  order?: number;
  slug: string;
  title: string;
};

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function escapeFrontMatter(value: string) {
  return JSON.stringify(value);
}

function parseFrontMatter(fileContents: string, fileName: string): EditablePost {
  const frontMatterMatch = fileContents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    throw new Error(`${fileName} is missing front matter.`);
  }

  const rawFrontMatter = frontMatterMatch[1];
  const body = frontMatterMatch[2].trim();
  const data = Object.fromEntries(
    rawFrontMatter
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

        return [key, value];
      })
  );

  const slug = cleanText(data.slug, 120) || slugify(data.title || fileName.replace(/\.md$/, ""));

  return {
    body,
    category: cleanText(data.category, 80),
    date: /^\d{4}-\d{2}-\d{2}$/.test(cleanText(data.date, 20)) ? cleanText(data.date, 20) : new Date().toISOString().slice(0, 10),
    excerpt: cleanText(data.excerpt, 500),
    featuredImage: cleanText(data.featuredImage, 300),
    fileName,
    originalSlug: slug,
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : undefined,
    slug,
    title: cleanText(data.title, 160)
  };
}

function normalizePosts(value: unknown): EditablePost[] {
  if (!Array.isArray(value)) {
    throw new Error("Posts must be a list.");
  }

  return value.map((item, index) => {
    const data = (item || {}) as Record<string, unknown>;
    const title = cleanText(data.title, 160) || `Untitled post ${index + 1}`;
    const slug = slugify(cleanText(data.slug, 120) || title) || `post-${Date.now()}-${index}`;
    const originalSlug = slugify(cleanText(data.originalSlug, 120));
    const fileName = cleanText(data.fileName, 160);

    return {
      body: String(data.body ?? "").trim(),
      category: cleanText(data.category, 80) || "Writing",
      date: /^\d{4}-\d{2}-\d{2}$/.test(cleanText(data.date, 20)) ? cleanText(data.date, 20) : new Date().toISOString().slice(0, 10),
      excerpt: cleanText(data.excerpt, 500),
      featuredImage: cleanText(data.featuredImage, 300) || "/archive/press-terminal.svg",
      fileName: fileName.endsWith(".md") ? fileName : undefined,
      originalSlug: originalSlug || undefined,
      order: index + 1,
      slug,
      title
    };
  });
}

function postFileName(post: EditablePost) {
  if (post.fileName && post.originalSlug === post.slug) {
    return post.fileName;
  }

  return `${post.slug}.md`;
}

function formatPost(post: EditablePost) {
  const orderLine = Number.isFinite(post.order) ? `order: ${post.order}\n` : "";

  return `---\ntitle: ${escapeFrontMatter(post.title)}\ndate: ${escapeFrontMatter(post.date)}\nslug: ${escapeFrontMatter(post.slug)}\n${orderLine}excerpt: ${escapeFrontMatter(post.excerpt)}\ncategory: ${escapeFrontMatter(post.category)}\nfeaturedImage: ${escapeFrontMatter(post.featuredImage)}\n---\n\n${post.body.trim()}\n`;
}

async function readLocalPosts() {
  const directory = path.join(process.cwd(), postsDirectory);
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".md"));
  const posts = await Promise.all(
    files.map(async (file) => parseFrontMatter(await fs.readFile(path.join(directory, file), "utf8"), file))
  );

  return posts.sort((left, right) => {
    if (left.order || right.order) {
      return (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) || right.date.localeCompare(left.date);
    }

    return right.date.localeCompare(left.date);
  });
}

async function writeLocalPosts(posts: EditablePost[]) {
  const directory = path.join(process.cwd(), postsDirectory);
  const currentFiles = new Set((await fs.readdir(directory)).filter((file) => file.endsWith(".md")));
  const nextFiles = new Set<string>();

  for (const post of posts) {
    const fileName = postFileName(post);
    nextFiles.add(fileName);
    await fs.writeFile(path.join(directory, fileName), formatPost(post), "utf8");
  }

  await Promise.all(
    Array.from(currentFiles)
      .filter((fileName) => !nextFiles.has(fileName))
      .map((fileName) => fs.unlink(path.join(directory, fileName)))
  );
}

async function githubRequest(url: string, options: RequestInit, token: string) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "paul-archive-post-editor",
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

async function getGithubHead(config: GithubConfig & { token: string }) {
  const refUrl = `https://api.github.com/repos/${config.repo}/git/ref/heads/${config.branch}`;
  const ref = await githubRequest(refUrl, { method: "GET" }, config.token);
  const commitSha = String(ref.object?.sha || "");
  const commitUrl = `https://api.github.com/repos/${config.repo}/git/commits/${commitSha}`;
  const commit = await githubRequest(commitUrl, { method: "GET" }, config.token);

  return {
    commitSha,
    treeSha: String(commit.tree?.sha || "")
  };
}

async function listGithubPostPaths(config: GithubConfig & { token: string }, treeSha: string) {
  const url = `https://api.github.com/repos/${config.repo}/git/trees/${treeSha}?recursive=1`;
  const payload = await githubRequest(url, { method: "GET" }, config.token);
  const tree = Array.isArray(payload.tree) ? payload.tree : [];

  return tree
    .filter((item: any) => item.type === "blob" && typeof item.path === "string")
    .map((item: any) => String(item.path))
    .filter((filePath: string) => filePath.startsWith(`paul-mcnally-archive/${postsDirectory}/`) && filePath.endsWith(".md"))
    .sort();
}

async function readGithubFile(config: GithubConfig & { token: string }, repoPath: string) {
  const url = `https://api.github.com/repos/${config.repo}/contents/${repoPath}?ref=${config.branch}`;
  const payload = await githubRequest(url, { method: "GET" }, config.token);

  return Buffer.from(typeof payload.content === "string" ? payload.content : "", "base64").toString("utf8");
}

async function readGithubPosts(config: GithubConfig & { token: string }) {
  const head = await getGithubHead(config);
  const paths = await listGithubPostPaths(config, head.treeSha);
  const posts = await Promise.all(
    paths.map(async (repoPath: string) => parseFrontMatter(await readGithubFile(config, repoPath), path.basename(repoPath)))
  );

  return posts.sort((left, right) => {
    if (left.order || right.order) {
      return (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) || right.date.localeCompare(left.date);
    }

    return right.date.localeCompare(left.date);
  });
}

async function createGithubBlob(config: GithubConfig & { token: string }, content: string) {
  const url = `https://api.github.com/repos/${config.repo}/git/blobs`;
  const payload = await githubRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({
        content,
        encoding: "utf-8"
      })
    },
    config.token
  );

  return String(payload.sha || "");
}

async function writeGithubPosts(config: GithubConfig & { token: string }, posts: EditablePost[]) {
  const head = await getGithubHead(config);
  const currentPaths = await listGithubPostPaths(config, head.treeSha);
  const currentEntries = await Promise.all(
    currentPaths.map(async (repoPath: string) => [repoPath, await readGithubFile(config, repoPath)] as const)
  );
  const currentContent = new Map<string, string>(currentEntries);
  const nextContent = new Map<string, string>(
    posts.map((post) => [`paul-mcnally-archive/${postsDirectory}/${postFileName(post)}`, formatPost(post)] as const)
  );
  const tree = [];

  for (const [repoPath, content] of nextContent) {
    if (currentContent.get(repoPath) !== content) {
      tree.push({
        path: repoPath,
        mode: "100644",
        type: "blob",
        sha: await createGithubBlob(config, content)
      });
    }
  }

  for (const repoPath of currentContent.keys()) {
    if (!nextContent.has(repoPath)) {
      tree.push({
        path: repoPath,
        mode: "100644",
        type: "blob",
        sha: null
      });
    }
  }

  if (tree.length === 0) {
    return {
      changedFiles: 0,
      commit: undefined
    };
  }

  const treeUrl = `https://api.github.com/repos/${config.repo}/git/trees`;
  const newTree = await githubRequest(
    treeUrl,
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: head.treeSha,
        tree
      })
    },
    config.token
  );
  const commitUrl = `https://api.github.com/repos/${config.repo}/git/commits`;
  const commit = await githubRequest(
    commitUrl,
    {
      method: "POST",
      body: JSON.stringify({
        message: "Update Paul archive writing posts",
        tree: newTree.sha,
        parents: [head.commitSha],
        author: {
          name: config.committerName,
          email: config.committerEmail
        },
        committer: {
          name: config.committerName,
          email: config.committerEmail
        }
      })
    },
    config.token
  );
  const refUrl = `https://api.github.com/repos/${config.repo}/git/refs/heads/${config.branch}`;
  await githubRequest(
    refUrl,
    {
      method: "PATCH",
      body: JSON.stringify({
        sha: commit.sha
      })
    },
    config.token
  );

  return {
    changedFiles: tree.length,
    commit: commit as { sha?: string; html_url?: string }
  };
}

export async function GET(request: NextRequest) {
  if (!checkPassword(request)) {
    return sendJson(401, { ok: false, message: "Incorrect editor password." });
  }

  try {
    const config = getGithubConfig();
    const posts = config.token ? await readGithubPosts(config as GithubConfig & { token: string }) : await readLocalPosts();

    return sendJson(200, {
      ok: true,
      mode: config.token ? "github" : "local",
      posts
    });
  } catch (error) {
    return sendJson(500, { ok: false, message: error instanceof Error ? error.message : "Could not load writing posts." });
  }
}

export async function POST(request: NextRequest) {
  if (!checkPassword(request)) {
    return sendJson(401, { ok: false, message: "Incorrect editor password." });
  }

  try {
    const body = (await request.json()) as { posts?: unknown };
    const posts = normalizePosts(body.posts || []);
    const config = getGithubConfig();

    if (config.token) {
      const result = await writeGithubPosts(config as GithubConfig & { token: string }, posts);
      return sendJson(200, {
        ok: true,
        mode: "github",
        message: result.changedFiles > 0 ? "Writing posts saved to GitHub." : "No writing post changes to save.",
        changedFiles: result.changedFiles,
        commitSha: result.commit?.sha
      });
    }

    await writeLocalPosts(posts);
    return sendJson(200, {
      ok: true,
      mode: "local",
      message: "Writing posts saved locally. Rebuild or restart to see static output update."
    });
  } catch (error) {
    return sendJson(500, { ok: false, message: error instanceof Error ? error.message : "Could not save writing posts." });
  }
}
