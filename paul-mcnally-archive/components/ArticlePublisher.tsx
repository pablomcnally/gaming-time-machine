"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { articleAssetPath, articleIssues, articleSlug, articleWarnings, assetName, emptyArticle, importArticle, type ArticleDraft } from "../lib/articlePublishing";
import { getArticleTopics, topics } from "../lib/topics";
import { MarkdownBody } from "./MarkdownContent";
import { ArchiveNotice } from "./ArchiveNotice";

type Asset = { file: File; path: string; url: string };
const draftKey = "pablonet-article-draft-v1";
export function ArticlePublisher() {
  const [draft, setDraft] = useState<ArticleDraft>(emptyArticle);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"github" | "local" | null>(null);
  const [status, setStatus] = useState("Import an article or fill in the fields below.");
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [published, setPublished] = useState(false);
  const [edition, setEdition] = useState<"pablonet" | "pro">("pablonet");
  const urls = useRef<string[]>([]);
  useEffect(() => {
    try { const saved = localStorage.getItem(draftKey); if (saved) { setDraft({ ...emptyArticle, ...JSON.parse(saved) }); setStatus("Text draft restored. Reattach its images before publishing."); } setPassword(sessionStorage.getItem("paulArchiveEditorPassword") || ""); } catch { /* Draft storage is optional. */ }
    return () => urls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  useEffect(() => {
    function leave(event: BeforeUnloadEvent) { if (!published && (draft.body || assets.length)) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [draft.body, assets.length, published]);
  function update<K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) { setDraft((current) => ({ ...current, [key]: value })); setChecked(false); setReviewed(false); }
  const resolved = useMemo(() => {
    function replacement(token: string) {
      if (bindings[token]) return bindings[token];
      const name = token.replace(/^asset:/, "");
      const matches = assets.filter((asset) => assetName(asset.file.name) === assetName(name));
      return matches.length === 1 ? matches[0].path : token;
    }
    return { ...draft, featuredImage: draft.featuredImage.startsWith("asset:") ? replacement(draft.featuredImage) : draft.featuredImage, body: draft.body.replace(/asset:[^)\n]+/g, replacement) };
  }, [draft, assets, bindings]);
  const imageUrls = Object.fromEntries(assets.map((asset) => [asset.path, asset.url]));
  const errors = articleIssues(resolved, assets.map((asset) => asset.path), topics.map((topic) => topic.slug));
  const warnings = articleWarnings(resolved);
  const tokens = [...new Set([...(draft.body.match(/asset:[^)\n]+/g) || []), ...(draft.featuredImage.startsWith("asset:") ? [draft.featuredImage] : [])])];
  function saveDraft() {
    try { localStorage.setItem(draftKey, JSON.stringify(draft)); setStatus("Text draft saved in this browser. Images must be reattached after closing the page."); } catch { setStatus("This browser could not save the draft."); }
  }
  async function importFile(file: File) {
    if (file.size > 300000) { setStatus("Choose a Markdown file smaller than 300KB."); return; }
    if (assets.length) { setStatus("Start a fresh article before importing another file."); return; }
    const data = importArticle(await file.text());
    setDraft({ ...emptyArticle, ...data }); setBindings({}); setChecked(false); setReviewed(false); setPublished(false);
    setStatus("Imported. Check the section, date and opening paragraph, then attach your images.");
  }
  function addImages(files: File[]) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) { setStatus("Choose the article URL name before attaching images."); return; }
    if (assets.length + files.length > 20 || [...assets.map((asset) => asset.file), ...files].reduce((sum, file) => sum + file.size, 0) > 3 * 1024 * 1024) { setStatus("Choose up to 20 images totalling 3MB or less. Resize larger images first."); return; }
    if (files.some((file) => !/\.(png|jpe?g|webp|gif)$/i.test(file.name))) { setStatus("Use PNG, JPG, WebP or GIF images."); return; }
    const next = files.map((file, index) => { const url = URL.createObjectURL(file); urls.current.push(url); return { file, url, path: articleAssetPath(`${draft.kind}-${draft.slug}`, assets.length + index, file.name) }; });
    setAssets((current) => [...current, ...next]); setChecked(false); setStatus("Images attached to this draft. They will publish together with the article.");
  }
  async function unlock() {
    try {
      setBusy(true); const response = await fetch("/api/articles", { headers: { "x-editor-password": password } }); const result = await response.json();
      if (!response.ok || !result.publishAvailable) throw new Error(result.message || "Live publishing is not configured.");
      setMode(result.mode); sessionStorage.setItem("paulArchiveEditorPassword", password); setStatus(result.mode === "github" ? "Connected. Publishing will update both sites." : "Local preview connected. Saving here will not update the live sites.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not connect."); } finally { setBusy(false); }
  }
  async function submit(action: "check" | "publish") {
    try {
      setBusy(true); const form = new FormData(); form.set("article", JSON.stringify(resolved)); form.set("action", action); assets.forEach((asset) => form.append("images", asset.file));
      const response = await fetch("/api/articles", { method: "POST", headers: { "x-editor-password": password }, body: form }); const result = await response.json();
      if (!response.ok) { setChecked(false); throw new Error([result.message, ...(result.errors || [])].join(" ")); }
      setStatus(result.message); setChecked(true);
      if (action === "publish") { setPublished(true); try { localStorage.removeItem(draftKey); } catch { /* Optional storage. */ } }
    } catch (error) { setStatus(error instanceof Error ? error.message : "Publishing failed."); } finally { setBusy(false); }
  }
  function reset() {
    if ((draft.body || assets.length) && !published && !confirm("Start a new article? Save your text draft first if you want to keep it.")) return;
    urls.current.forEach((url) => URL.revokeObjectURL(url)); urls.current = []; setAssets([]); setBindings({}); setDraft(emptyArticle); setChecked(false); setReviewed(false); setPublished(false); setStatus("Ready for a new article.");
  }
  const inputClass = "publisher-input";
  function field(key: keyof ArticleDraft, label: string, type = "text") {
    return <label>{label}<input className={inputClass} type={type} value={draft[key]} disabled={busy || published || ((key === "slug") && !!assets.length)} onChange={(event) => update(key, event.target.value as never)} /></label>;
  }
  function imageChoice(key: "featuredImage" | "micronetImage", label: string) {
    return <label>{label}<select className={inputClass} value={key === "featuredImage" ? resolved[key] : draft[key]} onChange={(event) => update(key, event.target.value)}><option value="">Choose an image</option>{assets.map((asset) => <option value={asset.path} key={asset.path}>{asset.file.name}</option>)}</select></label>;
  }
  return <main className="publisher-page"><div className="publisher-container">
    <header><Link href="/editor">← Site editor</Link><h1>Add an archive article</h1><p>One article, two editions. Import your copy, attach its images, check the previews, then publish.</p></header>
    <section className="publisher-panel"><h2>Publishing connection</h2><div className="publisher-fields"><label>Editor password<input type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(event) => { setPassword(event.target.value); setMode(null); setChecked(false); }} /></label><button type="button" disabled={busy} onClick={unlock}>{mode ? "Reconnect" : "Connect"}</button></div><p role="status" className="publisher-status">{status}</p></section>
    <fieldset disabled={busy || published} className="publisher-panel"><legend>1. Article details</legend><div className="publisher-actions"><label className="publisher-upload">Import Markdown<input type="file" accept=".md,.markdown,text/markdown,text/plain" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ""; }} /></label><button type="button" onClick={saveDraft}>Save text draft</button></div>
      <div className="publisher-fields">{field("title", "Headline")}{field("slug", "Article URL name")}
        <label>Section<select className={inputClass} value={draft.kind} disabled={!!assets.length} onChange={(event) => update("kind", event.target.value as ArticleDraft["kind"])}>{["reviews", "features", "interviews", "opinion"].map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></label>
        {draft.kind === "reviews" ? <label>Review category<select className={inputClass} value={draft.category} onChange={(event) => update("category", event.target.value as ArticleDraft["category"])}><option value="tech">Tech reviews</option><option value="games">Game and book reviews</option></select></label> : null}
        {field("date", "Original publication date", "date")}{field("publication", "Publication")}{field("author", "Author")}{field("sourceUrl", "Original article URL", "url")}{field("excerpt", "Short description")}{field("tag", "Subject label (for example, 3D Printing)")}{field("imageCredit", "Image credit, if supplied")}{field("related", "Related articles (section/url-name, separated by commas)")}
      </div><p>Automatic topics: {getArticleTopics({ ...draft, topics: [] }).map((topic) => topic.title).join(", ") || "None yet"}</p><fieldset className="publisher-topics"><legend>Add extra topic collections</legend>{topics.map((topic) => <label key={topic.slug}><input type="checkbox" checked={draft.topics.split(",").map((value) => value.trim()).includes(topic.slug)} onChange={(event) => update("topics", [...new Set([...draft.topics.split(",").map((value) => value.trim()).filter((value) => value && value !== topic.slug), ...(event.target.checked ? [topic.slug] : [])])].join(", "))} /> {topic.title}</label>)}</fieldset>
    </fieldset>
    <fieldset disabled={busy || published} className="publisher-panel"><legend>2. Images and copy</legend><label className="publisher-upload">Attach images (3MB total)<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { addImages(Array.from(event.target.files || [])); event.target.value = ""; }} /></label><p>The URL name and section are fixed after attaching images. Use “Start another article” to begin again.</p>
      <div className="publisher-assets">{assets.map((asset) => <figure key={asset.path}><img src={asset.url} alt={asset.file.name} /><figcaption>{asset.file.name}</figcaption><button type="button" onClick={() => update("body", `${draft.body}\n\n![Describe this image](${asset.path})`)}>Insert into article</button></figure>)}</div>
      {tokens.map((token) => <label className="publisher-binding" key={token}>Match {token.slice(6)}<select className={inputClass} value={bindings[token] || assets.find((asset) => assetName(asset.file.name) === assetName(token.slice(6)))?.path || ""} onChange={(event) => { setBindings((current) => ({ ...current, [token]: event.target.value })); setChecked(false); }}><option value="">Choose matching image</option>{assets.map((asset) => <option key={asset.path} value={asset.path}>{asset.file.name}</option>)}</select></label>)}
      <div className="publisher-fields">{imageChoice("featuredImage", "Pro featured image")}{field("featuredImageAlt", "Pro image description")}{imageChoice("micronetImage", "Pablonet featured image")}{field("micronetImageAlt", "Pablonet image description")}</div>
      <label>Article body (Markdown)<textarea className={inputClass} rows={18} value={draft.body} onChange={(event) => update("body", event.target.value)} /></label>
      <p>The permanent archive notice is added automatically on both sites using the Publication and Original publication date fields. Leave it out of the article body.</p>
    </fieldset>
    <section className="publisher-panel"><h2>3. Check both versions</h2><div className="publisher-actions"><button type="button" aria-pressed={edition === "pablonet"} onClick={() => setEdition("pablonet")}>Pablonet preview</button><button type="button" aria-pressed={edition === "pro"} onClick={() => setEdition("pro")}>Pro preview</button></div>
      <article className={`publisher-preview ${edition === "pro" ? "publisher-preview-pro" : "publisher-preview-pablonet"}`}><p>{draft.publication} · {draft.date} · {draft.author}</p><h1>{draft.title || "Your headline"}</h1><p>{draft.excerpt}</p>{imageUrls[edition === "pro" ? resolved.featuredImage : resolved.micronetImage] ? <img className="publisher-lead" src={imageUrls[edition === "pro" ? resolved.featuredImage : resolved.micronetImage]} alt={edition === "pro" ? draft.featuredImageAlt : draft.micronetImageAlt} /> : null}<ArchiveNotice publication={draft.publication} date={draft.date} sourceUrl={draft.sourceUrl} pro={edition === "pro"} /><MarkdownBody content={resolved.body} imageUrls={imageUrls} className="publisher-prose" /></article>
      {errors.length ? <details><summary>{errors.length} checks to complete</summary><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></details> : <p>All form checks passed.</p>}
      {warnings.length ? <ul className="publisher-warnings">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
      <label className="publisher-confirm"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /> I have checked the opening paragraph, original date and both image previews.</label>
      <div className="publisher-actions"><button type="button" disabled={busy || published || !mode || !!errors.length} onClick={() => submit("check")}>Run publishing checks</button><button type="button" disabled={busy || published || !checked || !reviewed || !!errors.length} onClick={() => submit("publish")}>{busy ? "Working…" : mode === "local" ? "Save article locally" : "Publish to both sites"}</button><button type="button" disabled={busy} onClick={reset}>Start another article</button></div>
      <p className="publisher-status">{status}</p>
      {published && mode === "github" ? <p>The deployment may take a few minutes. <a href={`/${draft.kind}/${draft.slug}`} target="_blank" rel="noreferrer">Open Pablonet article</a> · <a href={`/pro/${draft.kind}/${draft.slug}`} target="_blank" rel="noreferrer">Open Pro article</a></p> : null}
    </section>
  </div></main>;
}
