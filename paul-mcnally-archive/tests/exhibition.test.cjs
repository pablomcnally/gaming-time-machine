const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const ts=require('typescript');

test('new editor articles join Exhibition through micronetImage without a registry edit',async t=>{
 const {loadExhibitionArticles,directories}=await import('../exhibition/content.mjs');
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'exhibition-publishing-'));
 t.after(async()=>{const resolved=path.resolve(root),prefix=path.resolve(os.tmpdir())+path.sep+'exhibition-publishing-';if(!resolved.startsWith(prefix))throw new Error('Unexpected fixture path');await fs.rm(resolved,{recursive:true,force:true});});
 await fs.mkdir(path.join(root,'data'),{recursive:true});
 await fs.writeFile(path.join(root,'data/portfolioPreviews.ts'),'const previews = {"legacy-story": "/legacy.png"};');
 for(const dir of Object.values(directories))await fs.mkdir(path.join(root,dir),{recursive:true});
 await fs.writeFile(path.join(root,directories.features,'legacy.md'),'---\ntitle: "Legacy"\nslug: "legacy-story"\ndate: "2020-01-01"\n---\n\nLegacy text.');
 const before=await loadExhibitionArticles(root);assert.equal(before.length,1);
 const source=await fs.readFile(path.join(__dirname,'../lib/articlePublishing.ts'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{}};vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`)(name=>name==='./markdownStructure'?{normalizeMarkdownStructure:body=>body}:require(name),module,module.exports);
 const {emptyArticle,formatArticle}=module.exports;
 const draft={...emptyArticle,title:'A new published review',slug:'new-review',date:'2026-10-28',excerpt:'The full story.',publication:'Example publication',sourceUrl:'https://example.com/new-review',featuredImage:'/photo.webp',micronetImage:'/portfolio/uploads/new-review/pixel.png',body:'The complete new article.'};
 await fs.writeFile(path.join(root,directories.reviews,'new-review.md'),formatArticle(draft));
 const after=await loadExhibitionArticles(root);assert.equal(after.length,2);const added=after.find(a=>a.slug==='new-review');assert.equal(added.originalImage,draft.micronetImage);assert.equal(added.kind,'reviews');assert.match(added.body,/complete new article/);
});

test('article parsing preserves the Pablonet featured image used by the publisher',async()=>{
 const {parseArticle}=await import('../exhibition/content.mjs');const article=parseArticle('---\nslug: "example"\nmicronetImage: "/new-art.png"\n---\n\nFull copy.');assert.equal(article.micronetImage,'/new-art.png');assert.equal(article.body.trim(),'Full copy.');
});

test('edition routing preserves an article when entering Exhibition from either existing edition',async()=>{
 const source=await fs.readFile(path.join(__dirname,'../lib/editionRoutes.ts'),'utf8');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const module={exports:{}};vm.runInThisContext(`(function(exports){${compiled}\n})`)(module.exports);
 const {getExhibitionEditionHref,getProfessionalEditionHref,getPablonetEditionHref}=module.exports;
 assert.equal(getExhibitionEditionHref('/'),'/exhibition');assert.equal(getExhibitionEditionHref('/pro'),'/exhibition');assert.equal(getExhibitionEditionHref('/reviews/test-review'),'/exhibition?article=test-review');assert.equal(getExhibitionEditionHref('/pro/features/test-feature'),'/exhibition?article=test-feature');assert.equal(getProfessionalEditionHref('/reviews/test-review'),'/pro/reviews/test-review');assert.equal(getPablonetEditionHref('/pro/features/test-feature'),'/features/test-feature');
});
