const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
function load(relative, overrides = {}, extras = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports,process,fetch){${code}\n})`, { filename })((name) => overrides[name] || require(name), module, module.exports, extras.process || process, extras.fetch || fetch);
  return module.exports;
}
const publishing = load("lib/articlePublishing.ts");
const subject = load("lib/topics.ts");
const { emptyArticle, articleIssues, articleWarnings, importArticle, articleAssetPath } = publishing;
const topicSlugs = subject.topics.map((topic) => topic.slug);
function draft() { return { ...emptyArticle, title: "A resin printer review", slug: "test-printer", date: "2024-03-28", excerpt: "A detailed printer review.", publication: "ReadWrite", sourceUrl: "https://readwrite.com/example", featuredImage: "/portfolio/uploads/reviews-test-printer/1-image.png", featuredImageAlt: "A printer", micronetImage: "/portfolio/uploads/reviews-test-printer/1-image.png", micronetImageAlt: "Printer artwork", body: "There are resin printers and then there is this machine." }; }
test("topics combine precise subject matches with editorial choices", () => {
  assert.ok(subject.getArticleTopics({ title: "GKTwo resin printer", slug: "gktwo" }).some((topic) => topic.slug === "3d-printing-and-making"));
  assert.ok(subject.getArticleTopics({ title: "DCS World head tracking", slug: "dcs" }).some((topic) => topic.slug === "simulation"));
  assert.ok(subject.getArticleTopics({ title: "Unrelated", slug: "unrelated", topics: ["arcade-history"] }).some((topic) => topic.slug === "arcade-history"));
  assert.equal(subject.getArticleTopics({ title: "Audeze LCD-X headphones", slug: "audeze" }).length, 0);
});
test("editorial import preserves full opening, metadata, media placements and exact date", () => {
  const imported = importArticle('TYPE: Review\n\nTITLE: A printer\n\nORIGINAL LINK: https://example.com/review\n\nORIGINAL PUBLICATION: Example\n\nDATE: March 28, 2024\n\nINTRO:\n\nThe complete opening.\n\nSECTION: Details\n\n[IMAGE 2: model.jpg]\nCAPTION: A printed model\nPLACEMENT: Below the heading\n\nThe rest of the article.');
  assert.equal(imported.date, "2024-03-28"); assert.equal(imported.publication, "Example");
  assert.match(imported.body, /^The complete opening/); assert.match(imported.body, /## Details/);
  assert.match(imported.body, /!\[A printed model\]\(asset:model.jpg\)/); assert.doesNotMatch(imported.body, /PLACEMENT:/);
  assert.equal(importArticle("TITLE: Missing date\nDATE: October 2026 (exact date not supplied)\nINTRO:\nText.").date, "");
});
test("front matter import keeps article metadata without importing unsafe section values", () => {
  const result = importArticle('---\ntitle: "An article"\ndate: "2024-03-28"\nkind: "../../escape"\nsourceUrl: "https://example.com"\n---\n\nOpening.');
  assert.equal(result.title, "An article"); assert.equal(result.kind, undefined); assert.equal(result.body, "Opening.");
});
test("validation blocks impossible dates, path traversal, unresolved assets and unknown topics", () => {
  const article = draft(); const assets = [article.featuredImage];
  assert.deepEqual(articleIssues(article, assets, topicSlugs), []);
  for (const mutation of [{ date: "2024-02-31" }, { slug: "../escape" }, { body: "![Missing](asset:missing.jpg)" }, { topics: "unknown" }, { featuredImage: "/missing.webp" }, { sourceUrl: "https://?" }]) assert.ok(articleIssues({ ...article, ...mutation }, assets, topicSlugs).length);
  assert.match(articleWarnings({ ...article, body: "That makes reviewing it difficult." })[0], /opening/);
  assert.match(articleAssetPath("reviews-test-printer", 0, "../image.png"), /^\/portfolio\/uploads\/reviews-test-printer\/1-image.png$/);
});
test("publishing API rejects unauthenticated calls and validates without writing", async () => {
  const { NextRequest } = require("next/server");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pablonet-publisher-"));
  const route = load("app/api/articles/route.ts", { "../../../lib/articlePublishing": publishing, "../../../lib/topics": subject, "../../../lib/professional": { getProfessionalArticles: () => [] } }, { process: { env: { EDITOR_PASSWORD: "test-only-password" }, cwd: () => root } });
  try {
    const unauthorized = await route.POST(new NextRequest("http://localhost/api/articles", { method: "POST" })); assert.equal(unauthorized.status, 401);
    const form = () => { const data = new FormData(); data.set("article", JSON.stringify(draft())); data.append("images", new Blob([Buffer.from([137,80,78,71,13,10,26,10,0])], { type: "image/png" }), "image.png"); return data; };
    const request = (data) => new NextRequest("http://localhost/api/articles", { method: "POST", headers: { "x-editor-password": "test-only-password", origin: "http://localhost" }, body: data });
    const checked = await route.POST(request(form())); assert.equal(checked.status, 200); assert.deepEqual(fs.readdirSync(root), []);
    const publish = form(); publish.set("action", "publish"); const saved = await route.POST(request(publish)); assert.equal(saved.status, 200);
    const markdown = fs.readFileSync(path.join(root, "content/reviews/test-printer.md"), "utf8"); assert.match(markdown, /The complete|There are resin/);
    const duplicate = await route.POST(request(publish)); assert.equal(duplicate.status, 409); assert.equal(fs.readFileSync(path.join(root, "content/reviews/test-printer.md"), "utf8"), markdown);
    const invalid = form(); invalid.set("article", JSON.stringify({ ...draft(), slug: "new-printer" })); invalid.delete("images"); invalid.append("images", new Blob(["not an image"]), "image.png"); assert.equal((await route.POST(request(invalid))).status, 400);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test("GitHub publishing uploads a single commit and uses a non-forced ref update", async () => {
  const { NextRequest } = require("next/server"); const calls = [];
  const mockFetch = async (url, options) => {
    const endpoint = url.split("/gaming-time-machine/")[1]; const body = options.body ? JSON.parse(options.body) : undefined; calls.push({ endpoint, method: options.method, body });
    if (endpoint.startsWith("contents/")) return new Response("{}", { status: 404 });
    const payload = endpoint.startsWith("git/ref/") ? { object: { sha: "parent" } } : endpoint === "git/commits/parent" ? { tree: { sha: "base" } } : { sha: endpoint === "git/commits" ? "new-commit" : "new-blob" };
    return Response.json(payload);
  };
  const route = load("app/api/articles/route.ts", { "../../../lib/articlePublishing": publishing, "../../../lib/topics": subject, "../../../lib/professional": { getProfessionalArticles: () => [] } }, { process: { env: { EDITOR_PASSWORD: "test-only-password", GITHUB_TOKEN: "test-only-token" }, cwd: () => __dirname }, fetch: mockFetch });
  const form = new FormData(); form.set("article", JSON.stringify(draft())); form.set("action", "publish"); form.append("images", new Blob([Buffer.from([137,80,78,71,13,10,26,10,0])], { type: "image/png" }), "image.png");
  const result = await route.POST(new NextRequest("http://localhost/api/articles", { method: "POST", headers: { "x-editor-password": "test-only-password" }, body: form }));
  assert.equal(result.status, 200); assert.equal(calls.filter((call) => call.endpoint === "git/commits").length, 1);
  assert.equal(calls.find((call) => call.endpoint === "git/trees").body.tree.length, 2);
  assert.deepEqual(calls.at(-1).body, { sha: "new-commit", force: false });
});
