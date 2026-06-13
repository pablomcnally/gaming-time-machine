import fs from "node:fs";
import path from "node:path";

export type Post = {
  title: string;
  date: string;
  slug: string;
  excerpt: string;
  category: string;
  featuredImage: string;
  body: string;
  order?: number;
};

const postsDirectory = path.join(process.cwd(), "content", "posts");

function parseFrontMatter(fileContents: string) {
  const frontMatterMatch = fileContents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    throw new Error("Post is missing front matter.");
  }

  const rawFrontMatter = frontMatterMatch[1];
  const body = frontMatterMatch[2].trim();
  const data = Object.fromEntries(
    rawFrontMatter
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

        return [key, value];
      })
  );

  return { data, body };
}

export function getAllPosts() {
  const files = fs.readdirSync(postsDirectory);

  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(postsDirectory, file);
      const { data, body } = parseFrontMatter(fs.readFileSync(filePath, "utf8"));

      return {
        title: data.title,
        date: data.date,
        slug: data.slug,
        excerpt: data.excerpt,
        category: data.category,
        featuredImage: data.featuredImage,
        body,
        order: Number.isFinite(Number(data.order)) ? Number(data.order) : undefined
      } satisfies Post;
    })
    .sort((left, right) => {
      if (left.order || right.order) {
        return (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) || right.date.localeCompare(left.date);
      }

      return right.date.localeCompare(left.date);
    });
}

export function getPostBySlug(slug: string) {
  return getAllPosts().find((post) => post.slug === slug);
}

export function getPostCategories() {
  return Array.from(new Set(getAllPosts().map((post) => post.category))).sort();
}
