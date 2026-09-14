const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../lib/related.ts");
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const relatedModule = { exports: {} };
vm.runInThisContext(`(function(require, module, exports) { ${code}\n})`, { filename })(require, relatedModule, relatedModule.exports);
const { getRelatedArticles, getRelatedLabel, parseRelatedReferences } = relatedModule.exports;

function article(overrides) {
  return {
    kind: "features",
    slug: "article",
    title: "A games feature",
    excerpt: "A story about video games.",
    date: "2026-01-01",
    publication: "The Escapist",
    ...overrides
  };
}

test("editorial related references appear first across collections", () => {
  const current = article({
    slug: "dcs-world",
    title: "Getting into DCS World with head tracking",
    tag: "Flight Simulation",
    related: ["reviews/delanclip"]
  });
  const candidates = [
    current,
    article({ kind: "features", slug: "another-flight-sim", title: "Another flight simulator", tag: "Flight Simulation" }),
    article({ kind: "reviews", slug: "delanclip", title: "DelanClip head tracking review", category: "tech", tag: "Head Tracking" })
  ];

  assert.equal(getRelatedArticles(current, candidates, 2)[0].slug, "delanclip");
});

test("automatic recommendations favour shared subjects over recency", () => {
  const current = article({ slug: "ssx", title: "SSX and the history of arcade snowboarding", tag: "Retro Gaming" });
  const retro = article({ kind: "interviews", slug: "nba-jam", title: "NBA Jam and arcade sports", tag: "Retro Gaming", date: "2025-01-01" });
  const newer = article({ kind: "interviews", slug: "unrelated", title: "Modern display technology", tag: "Hardware", date: "2026-09-01" });

  assert.equal(getRelatedArticles(current, [current, newer, retro], 1)[0].slug, "nba-jam");
});

test("related front matter and labels use readable collection references", () => {
  assert.deepEqual(parseRelatedReferences("reviews/head-tracker, interviews/arcade-sports"), ["reviews/head-tracker", "interviews/arcade-sports"]);
  assert.equal(getRelatedLabel(article({ kind: "reviews", category: "tech" })), "Tech review");
});
