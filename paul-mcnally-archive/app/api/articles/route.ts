import fs from "node:fs/promises";
import path from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { articleAssetPath, articleDirectory, articleIssues, articleWarnings, emptyArticle, formatArticle, type ArticleDraft } from "../../../lib/articlePublishing";
import { topics } from "../../../lib/topics";
import { getProfessionalArticles } from "../../../lib/professional";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const limit = 3 * 1024 * 1024;
function authorized(request: NextRequest) {
  const expected = process.env.EDITOR_PASSWORD || (process.env.NODE_ENV === "development" ? "local-preview" : "");
  const supplied = request.headers.get("x-editor-password") || "";
  return !!expected && timingSafeEqual(createHash("sha256").update(expected).digest(), createHash("sha256").update(supplied).digest());
}
function response(status: number, body: object) { return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } }); }
function config() { return { token: process.env.GITHUB_TOKEN?.trim(), repo: process.env.GITHUB_REPO || "pablomcnally/gaming-time-machine", branch: process.env.GITHUB_BRANCH || "main" }; }
async function github(endpoint: string, method = "GET", body?: object, missingOK = false) {
  const { token, repo } = config();
  const result = await fetch(`https://api.github.com/repos/${repo}/${endpoint}`, { method, cache: "no-store", headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "paul-archive-article-editor", "X-GitHub-Api-Version": "2022-11-28" }, body: body ? JSON.stringify(body) : undefined });
  if (missingOK && result.status === 404) return null;
  if (result.status === 401) throw new Error("GitHub rejected the publishing token (401). Replace GITHUB_TOKEN in the Vercel project's Production environment with a valid GitHub token for pablomcnally/gaming-time-machine, then redeploy and reconnect. Your editor password and article draft do not need changing.");
  if (result.status === 403) throw new Error("GitHub denied publishing access (403). Check that GITHUB_TOKEN has Contents: Read and write permission for pablomcnally/gaming-time-machine and is approved for the repository. If GitHub has temporarily rate-limited it, retry after the limit resets.");
  if (result.status === 404) throw new Error("GitHub could not access the archive repository or branch (404). Check the publishing token's repository access and the GITHUB_REPO and GITHUB_BRANCH settings.");
  if (!result.ok) throw new Error(result.status === 422 || result.status === 409 ? "The archive changed while publishing. Check the live article before retrying; no existing work was overwritten." : `Publishing service returned ${result.status}. Please try again later.`);
  return result.json();
}
export async function GET(request: NextRequest) {
  if (!authorized(request)) return response(401, { ok: false, message: "Enter the editor password." });
  try {
    const { token, branch } = config();
    if (token) await github(`git/ref/heads/${branch}`);
    return response(200, { ok: true, mode: token ? "github" : "local", publishAvailable: !!token || !process.env.VERCEL });
  } catch (error) {
    return response(502, { ok: false, publishAvailable: false, message: error instanceof Error ? error.message : "Could not verify the publishing connection." });
  }
}
export async function POST(request: NextRequest) {
  if (!authorized(request)) return response(401, { ok: false, message: "Incorrect editor password." });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== (request.headers.get("host") || request.nextUrl.host)) return response(403, { ok: false, message: "Publish from the site editor." });
  if (Number(request.headers.get("content-length") || 0) > limit + 400000) return response(413, { ok: false, message: "Choose images totalling 3MB or less." });
  try {
    const form = await request.formData();
    const raw = JSON.parse(String(form.get("article") || "{}"));
    const draft = Object.fromEntries(Object.keys(emptyArticle).map((key) => [key, typeof raw[key] === "string" ? raw[key] : ""])) as ArticleDraft;
    const files = form.getAll("images").filter((file): file is File => typeof file !== "string");
    if (files.length > 20 || files.reduce((sum, file) => sum + file.size, 0) > limit) throw new Error("Choose up to 20 images totalling 3MB or less. Resize large images before uploading.");
    const images = await Promise.all(files.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.split(".").pop()?.toLowerCase();
      const valid = extension === "png" ? buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : /^(jpg|jpeg)$/.test(extension || "") ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 : extension === "webp" ? buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" : extension === "gif" && /^GIF8[79]a$/.test(buffer.toString("ascii", 0, 6));
      if (!valid || !buffer.length) throw new Error(`Use a valid PNG, JPG, WebP or GIF image: ${file.name}.`);
      return { path: articleAssetPath(`${draft.kind}-${draft.slug}`, index, file.name), buffer };
    }));
    const errors = articleIssues(draft, images.map((image) => image.path), topics.map((topic) => topic.slug));
    const articles = getProfessionalArticles();
    const known = new Set(articles.map((article) => `${article.kind}/${article.slug}`));
    if (known.has(`${draft.kind}/${draft.slug}`)) errors.push("An article with this URL already exists. Choose a different URL name.");
    for (const reference of draft.related.split(",").map((item) => item.trim()).filter(Boolean)) if (!known.has(reference)) errors.push(`Related article not found: ${reference}.`);
    const routeSet = new Set(["/", "/pro", "/about", "/contact", "/work", "/topics", ...["features", "interviews", "opinion", "reviews", "blog"].flatMap((kind) => [`/${kind}`, `/pro/${kind}`]), "/reviews/tech", "/reviews/games", "/pro/reviews/tech", "/pro/reviews/games", ...articles.flatMap((article) => [`/${article.kind}/${article.slug}`, `/pro/${article.kind}/${article.slug}`]), ...topics.flatMap((topic) => [`/topics/${topic.slug}`, `/pro/topics/${topic.slug}`])] );
    for (const match of draft.body.matchAll(/(?<!!)\[[^\]]+\]\((\/[^)\s]+)\)/g)) if (!routeSet.has(match[1].split(/[?#]/)[0])) errors.push(`Internal link not found: ${match[1]}.`);
    if (errors.length) return response(400, { ok: false, errors, message: "Fix the listed checks before publishing." });
    const relative = `${articleDirectory(draft.kind)}/${draft.slug}.md`;
    const { token, branch } = config();
    const baseRef = token ? await github(`git/ref/heads/${branch}`) : null;
    if (token) {
      const existing = await github(`contents/paul-mcnally-archive/${relative}?ref=${baseRef.object.sha}`, "GET", undefined, true);
      if (existing) return response(409, { ok: false, message: "This article already exists on GitHub. It has not been overwritten." });
    } else {
      if (process.env.VERCEL) throw new Error("Publishing is not configured. Add GITHUB_TOKEN in the hosting settings.");
      try { await fs.access(path.join(process.cwd(), relative)); return response(409, { ok: false, message: "This article already exists locally." }); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    if (form.get("action") !== "publish") return response(200, { ok: true, warnings: articleWarnings(draft), message: "Checks passed. Review both previews and the opening paragraph, then publish." });
    const markdown = formatArticle(draft);
    if (token) {
      const ref = baseRef;
      const head = await github(`git/commits/${ref.object.sha}`);
      // Images and Markdown land in one commit, so no partial article is deployed.
      const entries = [];
      for (const image of images) {
        const blob = await github("git/blobs", "POST", { content: image.buffer.toString("base64"), encoding: "base64" });
        entries.push({ path: `paul-mcnally-archive/public${image.path}`, mode: "100644", type: "blob", sha: blob.sha });
      }
      const articleBlob = await github("git/blobs", "POST", { content: markdown, encoding: "utf-8" });
      entries.push({ path: `paul-mcnally-archive/${relative}`, mode: "100644", type: "blob", sha: articleBlob.sha });
      const tree = await github("git/trees", "POST", { base_tree: head.tree.sha, tree: entries });
      const commit = await github("git/commits", "POST", { message: `Publish archive article: ${draft.title}`, tree: tree.sha, parents: [ref.object.sha] });
      await github(`git/refs/heads/${branch}`, "PATCH", { sha: commit.sha, force: false });
      return response(200, { ok: true, mode: "github", commitSha: commit.sha, message: "Published to GitHub. Both sites will update when the deployment finishes." });
    }
    const created: string[] = [];
    try {
      for (const image of images) { const target = path.join(process.cwd(), "public", image.path); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, image.buffer, { flag: "wx" }); created.push(target); }
      const target = path.join(process.cwd(), relative); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, markdown, { flag: "wx" });
    } catch (error) { await Promise.all(created.map((file) => fs.unlink(file))); throw error; }
    return response(200, { ok: true, mode: "local", message: "Saved locally with its images. Rebuild and deploy to update the live sites." });
  } catch (error) { return response(400, { ok: false, message: error instanceof Error ? error.message : "Could not publish the article." }); }
}
