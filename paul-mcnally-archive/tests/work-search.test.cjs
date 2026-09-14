const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../lib/workSearch.ts");
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const workSearchModule = { exports: {} };
vm.runInThisContext(`(function(require, module, exports) { ${code}\n})`, { filename })(require, workSearchModule, workSearchModule.exports);
const { filterWorkArticles, getWorkFilterOptions } = workSearchModule.exports;

const articles = [
  { title: "DCS World guide", excerpt: "Military flight simulation", publication: "The Escapist", date: "2026-09-11", kind: "features", tag: "Flight Simulation" },
  { title: "DelanClip review", excerpt: "Infrared head tracking", publication: "The Escapist", date: "2026-09-12", kind: "reviews", category: "tech", tag: "Head Tracking" },
  { title: "SSX history", excerpt: "Arcade snowboarding", publication: "GamesHub", date: "2026-09-10", kind: "features", tag: "Retro Gaming" }
];

test("work search combines keywords with publication and topic filters", () => {
  const results = filterWorkArticles(articles, {
    query: "military",
    publication: "The Escapist",
    topic: "Flight Simulation",
    sort: "newest"
  });

  assert.deepEqual(results.map((article) => article.title), ["DCS World guide"]);
});

test("work search exposes complete publication and topic options", () => {
  assert.deepEqual(getWorkFilterOptions(articles), {
    publications: ["GamesHub", "The Escapist"],
    topics: ["Flight Simulation", "Head Tracking", "Retro Gaming"]
  });
});

test("work search can sort the complete index oldest first", () => {
  const results = filterWorkArticles(articles, { query: "", publication: "", topic: "", sort: "oldest" });
  assert.deepEqual(results.map((article) => article.title), ["SSX history", "DCS World guide", "DelanClip review"]);
});
