import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = new URL(process.argv[2] || "http://127.0.0.1:3030");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Use a local preview for these checks.");

const directories = {
  features: "content/portfolio/features",
  interviews: "content/portfolio/interviews",
  reviews: "content/reviews",
  blog: "content/blog"
};
const articles = Object.entries(directories).flatMap(([kind, directory]) =>
  fs.readdirSync(path.join(root, directory)).filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md").map((file) => {
    const raw = fs.readFileSync(path.join(root, directory, file), "utf8");
    const front = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(front, `Front matter: ${file}`);
    const data = Object.fromEntries(front[1].split(/\r?\n/).filter(Boolean).map((line) => {
      const separator = line.indexOf(":");
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^["']|["']$/g, "")];
    }));
    return { ...data, kind };
  })
);

async function read(route, expected = 200) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, expected, `${route}: HTTP status`);
  return response.text();
}

function assertProfessional(html, route) {
  assert.ok(/class="pro-site"/.test(html), `${route}: professional layout`);
  assert.ok(!/class="(?:crt-stage|site-background-video)"/.test(html), `${route}: no terminal media or frame`);
}

const indexRoutes = ["/pro", "/pro/work", "/pro/about", "/pro/contact", ...Object.keys(directories).map((kind) => `/pro/${kind}`), "/pro/reviews/games", "/pro/reviews/tech"];
for (const route of indexRoutes) assertProfessional(await read(route), route);
const home = await read("/pro");
assert.match(home, /<title>Paul McNally \| Games &amp; Technology Journalist<\/title>/, "Homepage title is not duplicated");
const work = await read("/pro/work");
const assets = new Set();
for (const article of articles) {
  const route = `/pro/${article.kind}/${article.slug}`;
  assert.ok(work.includes(`href="${route}"`), `${route}: included in work library`);
  const html = await read(route);
  assertProfessional(html, route);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.equal(new URL(canonical?.[1]).pathname, `/${article.kind}/${article.slug}`, `${route}: original canonical`);
  const images = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
  if (article.featuredImage) assert.ok(images.includes(article.featuredImage), `${route}: original featured image`);
  assert.ok(images.every((src) => !src.startsWith("/portfolio/home/")), `${route}: no dedicated pixel previews`);
  images.filter((src) => src.startsWith("/")).forEach((src) => assets.add(src));
}
for (const asset of assets) {
  const response = await fetch(new URL(asset, base), { method: "HEAD" });
  assert.equal(response.status, 200, `Image: ${asset}`);
}
const contactData = JSON.parse(fs.readFileSync(path.join(root, "data/contact.json"), "utf8"));
const contact = await read("/pro/contact");
assert.ok(contact.includes(`action="${contactData.formAction}"`), "Shared contact endpoint");
assert.doesNotMatch(contact, /mailto:|p\.mcnally@btopenworld\.com/i, "No exposed private address");
for (const name of ["name", "email", "subject", "message", "_gotcha"]) assert.ok(contact.includes(`name="${name}"`), `Contact field: ${name}`);
// Next streams missing-page boundaries; browser checks cover their hydrated layout.
for (const route of ["/pro/not-a-collection", "/pro/features/not-an-article"]) await read(route, 404);
const terminal = await read("/");
assert.match(terminal, /class="crt-stage"/, "Terminal retains its CRT shell");
assert.match(terminal, /PABLONET 800 SERVICES/, "Terminal branding remains");
const sitemap = await read("/sitemap.xml");
for (const route of indexRoutes) assert.ok(sitemap.includes(`${route}</loc>`), `Sitemap: ${route}`);
console.log(`PASS: ${indexRoutes.length} professional entry pages, ${articles.length} articles, ${assets.size} original images, canonical metadata, contact privacy, 404s and terminal isolation.`);
console.log("No contact form was submitted.");
