const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../lib/prestelServers.ts");
const loadedModule = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

vm.runInThisContext(`(function(require, module, exports) { ${code}\n})`, { filename })(require, loadedModule, loadedModule.exports);

const {
  getOrCreatePrestelServer,
  isPrestelServerName,
  pickPrestelServer,
  PRESTEL_SERVER_STORAGE_KEY,
  prestelServerNames
} = loadedModule.exports;

test("Prestel server list contains the seven requested names", () => {
  assert.deepEqual([...prestelServerNames], ["Dickens", "Keats", "Bronte", "Eliot", "Austen", "Burns", "Constable"]);
});

test("server picker can select the first and last entries", () => {
  assert.equal(pickPrestelServer(() => 0), "Dickens");
  assert.equal(pickPrestelServer(() => 0.999999), "Constable");
  assert.equal(isPrestelServerName("Austen"), true);
  assert.equal(isPrestelServerName("Shakespeare"), false);
});

test("connection and header reuse the same stored server", () => {
  const storage = {
    getItem(key) {
      return key === PRESTEL_SERVER_STORAGE_KEY ? "Bronte" : null;
    },
    setItem() {
      assert.fail("a valid stored server should not be replaced");
    }
  };

  assert.equal(getOrCreatePrestelServer(storage), "Bronte");
});
