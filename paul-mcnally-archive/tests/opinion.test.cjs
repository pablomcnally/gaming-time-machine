const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const opinionDirectory = path.join(root, "content", "portfolio", "opinion");
process.chdir(root);

function fixture(slug, date, extraFrontMatter = "") {
  return `---\ntitle: "${slug}"\ndate: "${date}"\nslug: "${slug}"\nexcerpt: "A test column"\npublication: "Test publication"\nauthor: "Paul McNally"\n${extraFrontMatter}sourceUrl: "https://example.com/${slug}"\n---\nColumn body.`;
}

// Inject opinion files in memory so test content never enters a production build.
function loadModules(fixtures = {}) {
  const cache = new Map();
  const mockedFs = {
    ...fs,
    readdirSync(directory, ...args) {
      return directory === opinionDirectory ? ["README.md", ...Object.keys(fixtures)] : fs.readdirSync(directory, ...args);
    },
    readFileSync(file, ...args) {
      return path.dirname(file) === opinionDirectory && fixtures[path.basename(file)] !== undefined
        ? fixtures[path.basename(file)] : fs.readFileSync(file, ...args);
    }
  };
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }
    }).outputText;
    const localRequire = (id) => {
      if (id === "node:fs") return mockedFs;
      if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), `${id}.ts`));
      return require(id);
    };
    vm.runInThisContext(`(function(require, module, exports) { ${code}\n})`, { filename })(localRequire, module, module.exports);
    return module.exports;
  }
  return { portfolio: load("lib/portfolio.ts"), pro: load("lib/professional.ts"), site: load("data/site.ts"), cards: load("components/pro/ArticleCard.tsx") };
}

test("empty opinion directory ignores README and is available in both editions", () => {
  const { portfolio, pro, site } = loadModules();
  assert.deepEqual(portfolio.getAllPortfolioPieces("opinion"), []);
  assert.deepEqual(pro.getProfessionalArticles("opinion"), []);
  assert.equal(pro.isProfessionalKind("opinion"), true);
  assert.equal(portfolio.getPortfolioKindLabel("opinion"), "Opinion Pieces");
  assert.deepEqual(site.navigationItems.find((item) => item.number === "301"), { number: "301", label: "Opinion Pieces", href: "/opinion" });
});

test("new opinion articles enter both indexes and receive page codes from 302", () => {
  const { portfolio, pro, cards } = loadModules({
    "older.md": fixture("older-column", "2014-05-13"),
    "newer.md": fixture("newer-column", "2020-05-18", "featuredImage: \"/pro.jpg\"\nmicronetImage: \"/pablonet.png\"\nmicronetImageAlt: \"Pixel artwork\"\n")
  });
  const entries = portfolio.getPortfolioPageEntries("opinion");
  assert.deepEqual(entries.map(({ number, href }) => ({ number, href })), [
    { number: "302", href: "/opinion/newer-column" },
    { number: "303", href: "/opinion/older-column" }
  ]);
  assert.equal(portfolio.getPortfolioPieceBySlug("opinion", "older-column").body, "Column body.");
  assert.equal(portfolio.getPortfolioPieceBySlug("opinion", "newer-column").micronetImage, "/pablonet.png");
  assert.equal(portfolio.getPortfolioPieceBySlug("opinion", "newer-column").micronetImageAlt, "Pixel artwork");
  assert.equal(portfolio.getAllPortfolioPieces().filter((piece) => piece.kind === "opinion").length, 2);
  assert.equal(portfolio.getPortfolioKeyboardPages().find((entry) => entry.number === "302").href, "/opinion/newer-column");
  const summaries = pro.getProfessionalSummaries("opinion");
  assert.deepEqual(summaries.map((piece) => piece.slug), ["newer-column", "older-column"]);
  assert.equal(summaries[0].sourceUrl, "https://example.com/newer-column");
  assert.equal("body" in summaries[0], false);
  assert.equal(cards.articleLabel(summaries[0]), "Opinion piece");
  assert.equal(pro.getProfessionalArticles().filter((piece) => piece.kind === "opinion").length, 2);
  assert.equal(pro.getProfessionalArticle("features", "newer-column"), undefined);
});

test("adding opinion leaves existing collections and page codes unchanged", () => {
  const before = loadModules();
  const after = loadModules({ "column.md": fixture("new-column", "2026-09-07") });
  for (const kind of ["features", "interviews", "reviews"]) {
    assert.deepEqual(after.portfolio.getPortfolioPageEntries(kind), before.portfolio.getPortfolioPageEntries(kind));
  }
  assert.deepEqual(after.pro.getProfessionalArticles("blog"), before.pro.getProfessionalArticles("blog"));
});
