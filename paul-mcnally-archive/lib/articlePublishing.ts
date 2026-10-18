import { normalizeMarkdownStructure } from "./markdownStructure";

export type ArticleDraft = {
  title: string; slug: string; date: string; excerpt: string; publication: string; author: string;
  kind: "reviews" | "features" | "interviews" | "opinion"; category: "tech" | "games";
  sourceUrl: string; tag: string; topics: string; related: string;
  featuredImage: string; featuredImageAlt: string; micronetImage: string; micronetImageAlt: string;
  imageCredit: string; body: string;
};
export const emptyArticle: ArticleDraft = { title: "", slug: "", date: "", excerpt: "", publication: "", author: "Paul McNally", kind: "reviews", category: "tech", sourceUrl: "", tag: "", topics: "", related: "", featuredImage: "", featuredImageAlt: "", micronetImage: "", micronetImageAlt: "", imageCredit: "", body: "" };
export function articleSlug(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100); }
export function articleDirectory(kind: string) {
  if (!["reviews", "features", "interviews", "opinion"].includes(kind)) throw new Error("Choose an article section.");
  return kind === "reviews" ? "content/reviews" : `content/portfolio/${kind}`;
}
export function assetName(value: string) { return value.toLowerCase().replace(/(?:\.(?:png|jpe?g|webp|gif))+$/g, "").replace(/[-_]\d+x\d+/g, "").replace(/[^a-z0-9]/g, ""); }
export function articleAssetPath(slug: string, index: number, name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  return `/portfolio/uploads/${slug}/${index + 1}-${articleSlug(name.replace(/\.[^.]+$/, ""))}.${extension}`;
}
function exactDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const match = value.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  const month = match ? months.indexOf(match[1].toLowerCase()) : -1;
  return match && month >= 0 ? `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[2].padStart(2, "0")}` : "";
}
export function importArticle(source: string): Partial<ArticleDraft> {
  const text = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const front = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const metadata: Record<string, string> = {};
  if (front) {
    for (const line of front[1].split("\n")) { const colon = line.indexOf(":"); if (colon > 0) metadata[line.slice(0, colon)] = line.slice(colon + 1).trim().replace(/^["']|["']$/g, ""); }
    return { ...Object.fromEntries(Object.entries(metadata).filter(([key]) => key in emptyArticle && key !== "kind" && key !== "category")), date: exactDate(metadata.date || ""), body: normalizeMarkdownStructure(front[2].trim()) };
  }
  for (const key of ["TITLE", "ORIGINAL LINK", "ORIGINAL PUBLICATION", "DATE", "TYPE"]) metadata[key] = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim() || "";
  let body = text.split(/^INTRO:\s*$/m)[1] ?? text;
  let featured = "";
  const opening = text.split(/^INTRO:\s*$/m)[0];
  const lead = opening.match(/\[IMAGE \d+: ([^\]]+)\]/);
  if (lead) featured = `asset:${lead[1]}`;
  body = body.replace(/\[IMAGE \d+: ([^\]]+)\]\n((?:(?:SOURCE|CAPTION|PLACEMENT):[^\n]*\n?)*)/g, (_all, name: string, details: string) => {
    const caption = details.match(/^CAPTION:\s*(.+)$/m)?.[1] || "";
    if (/Featured image/i.test(details)) { featured = `asset:${name}`; return "\n"; }
    return `\n\n![${caption === "No caption shown" ? name : caption}](asset:${name})\n\n`;
  });
  body = body.replace(/^SECTION: (.+)$/gm, "## $1").replace(/^TL;DR:[\t ]*$/gm, "## At a glance").replace(/^PROS:[\t ]*$/gm, "### Pros").replace(/^CONS:[\t ]*$/gm, "### Cons");
  body = body.replace(/\[YOUTUBE\]\n(https:\/\/www\.youtube\.com\/watch\?v=[\w-]+)\n(?:PLACEMENT:[^\n]*\n?)?/g, "\n[YOUTUBE:$1|Watch the video]\n");
  body = body.trim();
  if (metadata.TITLE && body.startsWith(metadata.TITLE + "\n")) body = body.slice(metadata.TITLE.length).trim();
  const kind = /interview/i.test(metadata.TYPE) ? "interviews" : /opinion/i.test(metadata.TYPE) ? "opinion" : /feature|news/i.test(metadata.TYPE) ? "features" : "reviews";
  return { title: metadata.TITLE, slug: articleSlug(metadata.TITLE), publication: metadata["ORIGINAL PUBLICATION"], sourceUrl: metadata["ORIGINAL LINK"], date: exactDate(metadata.DATE), kind, featuredImage: featured, body: normalizeMarkdownStructure(body.replace(/\n{3,}/g, "\n\n")) };
}
export function articleIssues(draft: ArticleDraft, assetPaths: string[], allowedTopics: string[]) {
  const errors: string[] = [];
  for (const field of ["title", "date", "slug", "excerpt", "publication", "author", "sourceUrl", "body", "featuredImage", "featuredImageAlt", "micronetImage", "micronetImageAlt"] as const) if (!draft[field]?.trim()) errors.push(`Add ${field.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug) || draft.slug.length > 100 || draft.slug === "readme" || ["tech", "games"].includes(draft.slug)) errors.push("Use a unique URL name containing lowercase letters, numbers and hyphens.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !Number.isFinite(Date.parse(draft.date)) || new Date(draft.date).toISOString().slice(0, 10) !== draft.date) errors.push("Choose the exact original publication date.");
  try {
    const source = new URL(draft.sourceUrl);
    if (!/^https?:$/.test(source.protocol) || !source.hostname || source.username || source.password) throw new Error();
  } catch { errors.push("Use a complete original publication URL."); }
  if (!["reviews", "features", "interviews", "opinion"].includes(draft.kind)) errors.push("Choose an article section.");
  if (draft.kind === "reviews" && !["games", "tech"].includes(draft.category)) errors.push("Choose a review category.");
  if (draft.body.length > 250000) errors.push("Article is too long (maximum 250,000 characters).");
  if (/asset:|\[IMAGE \d+:|^PLACEMENT:|^CAPTION:|^INTRO:/m.test(draft.body) || draft.featuredImage.startsWith("asset:")) errors.push("Match all image placeholders to uploaded images.");
  const images = [draft.featuredImage, draft.micronetImage, ...Array.from(draft.body.matchAll(/!\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g), (match) => match[1])];
  for (const image of new Set(images.filter(Boolean))) if (!assetPaths.includes(image)) errors.push(`Choose an uploaded image for ${image}.`);
  for (const topic of draft.topics.split(",").map((value) => value.trim()).filter(Boolean)) if (!allowedTopics.includes(topic)) errors.push(`Unknown topic: ${topic}.`);
  for (const related of draft.related.split(",").map((value) => value.trim()).filter(Boolean)) if (!/^(features|reviews|interviews|opinion|blog)\/[a-z0-9-]+$/.test(related)) errors.push(`Invalid related article: ${related}.`);
  for (const [key, value] of Object.entries(draft)) if (key !== "body" && /[\r\n"\\]/.test(value)) errors.push(`Remove line breaks, double quotes or backslashes from ${key}.`);
  return [...new Set(errors)];
}
export function articleWarnings(draft: ArticleDraft) {
  const warnings: string[] = [];
  const first = draft.body.split(/\n{2,}/).find((block) => block.trim() && !/^(#|!|\*Archive)/.test(block)) || "";
  if (/^(?:[,;:]|That makes|And |But |This means|These are)/i.test(first.trim())) warnings.push("The opening may be incomplete. Check it against the original before publishing.");
  if (/pre-order|available now|at the moment/i.test(draft.body) && draft.date < new Date().toISOString().slice(0, 10)) warnings.push("This older article contains time-sensitive wording. Consider adding an archive note.");
  return warnings;
}
export function formatArticle(draft: ArticleDraft) {
  const keys = ["title", "date", "slug", "excerpt", "publication", "author", ...(draft.kind === "reviews" ? ["category"] : []), "tag", "topics", "related", "featuredImage", "featuredImageAlt", "micronetImage", "micronetImageAlt", "imageCredit", "sourceUrl"] as (keyof ArticleDraft)[];
  return `---\n${keys.filter((key) => draft[key]).map((key) => `${key}: "${draft[key]}"`).join("\n")}\n---\n\n${normalizeMarkdownStructure(draft.body.trim())}\n`;
}
