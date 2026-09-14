import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const publicRoot = path.join(projectRoot, "public");
const errors = [];
const records = [];

const collections = [
  { kind: "features", directory: "content/portfolio/features", required: ["title", "date", "slug", "excerpt", "publication", "author", "sourceUrl"] },
  { kind: "interviews", directory: "content/portfolio/interviews", required: ["title", "date", "slug", "excerpt", "publication", "author", "sourceUrl"] },
  { kind: "opinion", directory: "content/portfolio/opinion", required: ["title", "date", "slug", "excerpt", "publication", "author", "sourceUrl"] },
  { kind: "reviews", directory: "content/reviews", required: ["title", "date", "slug", "excerpt", "publication", "author", "category", "sourceUrl"] },
  { kind: "blog", directory: "content/blog", required: ["title", "date", "slug", "excerpt"] },
  { kind: "writing", directory: "content/posts", required: ["title", "date", "slug", "excerpt", "category", "featuredImage"] }
];

const staticRoutes = new Set([
  "/", "/about", "/archive", "/blog", "/career", "/contact", "/features", "/interviews", "/micronet-800",
  "/opinion", "/pro", "/pro/about", "/pro/blog", "/pro/contact", "/pro/features", "/pro/interviews",
  "/pro/opinion", "/pro/reviews", "/pro/reviews/games", "/pro/reviews/tech", "/pro/work", "/reviews",
  "/reviews/games", "/reviews/tech", "/system-status", "/work", "/writing"
]);

function parseFrontMatter(contents, file) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    errors.push(`${file}: missing or invalid front matter.`);
    return null;
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/).filter(Boolean)) {
    const separator = line.indexOf(":");
    if (separator < 1) {
      errors.push(`${file}: invalid front matter line "${line}".`);
      continue;
    }
    const key = line.slice(0, separator).trim();
    data[key] = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
  }

  return { data, body: match[2] };
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function publicFileExists(webPath) {
  let current = publicRoot;
  const pathname = decodeURIComponent(webPath.split(/[?#]/)[0]);
  const segments = pathname.replace(/^\/+/, "").split("/").filter(Boolean);

  try {
    for (const segment of segments) {
      const exactName = fs.readdirSync(current).find((name) => name === segment);
      if (!exactName) return false;
      current = path.join(current, exactName);
    }
    return fs.statSync(current).isFile();
  } catch {
    return false;
  }
}

for (const collection of collections) {
  const directory = path.join(projectRoot, collection.directory);
  for (const filename of fs.readdirSync(directory).filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")) {
    const relativeFile = path.posix.join(collection.directory, filename);
    const parsed = parseFrontMatter(fs.readFileSync(path.join(directory, filename), "utf8"), relativeFile);
    if (!parsed) continue;
    const { data, body } = parsed;

    for (const field of collection.required) {
      if (!data[field]?.trim()) errors.push(`${relativeFile}: missing required ${field}.`);
    }
    if (!isValidDate(data.date)) errors.push(`${relativeFile}: date must be a real YYYY-MM-DD value.`);
    if (data.updatedDate && !isValidDate(data.updatedDate)) errors.push(`${relativeFile}: updatedDate must be a real YYYY-MM-DD value.`);
    if (data.updatedDate && data.date && data.updatedDate < data.date) errors.push(`${relativeFile}: updatedDate is earlier than date.`);
    if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) errors.push(`${relativeFile}: slug is not URL-safe.`);
    if (collection.kind === "reviews" && !["games", "tech"].includes(data.category)) errors.push(`${relativeFile}: review category must be games or tech.`);

    for (const field of ["sourceUrl"]) {
      if (!data[field]) continue;
      if (data[field].startsWith("/")) {
        if (!publicFileExists(data[field])) errors.push(`${relativeFile}: ${field} does not exist at ${data[field]}.`);
        continue;
      }
      try {
        const url = new URL(data[field]);
        if (!/^https?:$/.test(url.protocol)) throw new Error();
      } catch {
        errors.push(`${relativeFile}: ${field} must be a valid HTTP(S) URL.`);
      }
    }

    if (data.featuredImage && !data.featuredImageAlt && collection.kind !== "writing") errors.push(`${relativeFile}: featuredImage requires featuredImageAlt.`);
    if (data.micronetImage && !data.micronetImageAlt) errors.push(`${relativeFile}: micronetImage requires micronetImageAlt.`);

    records.push({ kind: collection.kind, file: relativeFile, data, body });
  }
}

const routes = new Set(staticRoutes);
const references = new Set();
for (const { kind, file, data } of records) {
  const route = `/${kind}/${data.slug}`;
  if (routes.has(route)) errors.push(`${file}: duplicate route ${route}.`);
  routes.add(route);
  if (kind !== "writing") {
    references.add(`${kind}/${data.slug}`);
    routes.add(`/pro/${kind}/${data.slug}`);
  }
}

for (const { file, data, body } of records) {
  for (const field of ["featuredImage", "micronetImage"]) {
    if (data[field] && !publicFileExists(data[field])) errors.push(`${file}: ${field} does not exist at ${data[field]}.`);
  }

  const imagePattern = /!\[[^\]]*\]\((\/[^)\s]+)(?:\s+["'][^)]*)?\)/g;
  for (const match of body.matchAll(imagePattern)) {
    if (!publicFileExists(match[1])) errors.push(`${file}: article image does not exist at ${match[1]}.`);
  }

  const linkPattern = /(?<!!)\[[^\]]+\]\((\/[^)\s]+)(?:\s+["'][^)]*)?\)/g;
  for (const match of body.matchAll(linkPattern)) {
    const target = match[1].split(/[?#]/)[0].replace(/\/$/, "") || "/";
    if (!routes.has(target) && !publicFileExists(target)) errors.push(`${file}: internal link does not resolve: ${match[1]}.`);
  }

  for (const reference of (data.related || "").split(",").map((value) => value.trim()).filter(Boolean)) {
    if (!references.has(reference)) errors.push(`${file}: related article does not resolve: ${reference}.`);
  }
}

if (errors.length) {
  console.error(`Content audit failed with ${errors.length} ${errors.length === 1 ? "error" : "errors"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const imageCount = records.reduce((count, { data, body }) =>
    count + Number(Boolean(data.featuredImage)) + Number(Boolean(data.micronetImage)) + Array.from(body.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)/g)).length, 0);
  console.log(`Content audit passed: ${records.length} articles, ${routes.size} routes and ${imageCount} local images checked.`);
}
