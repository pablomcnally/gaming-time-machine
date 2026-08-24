import fs from "node:fs";
import path from "node:path";

export type BlogPost = {
  title: string;
  date: string;
  slug: string;
  excerpt: string;
  author: string;
  tag?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  body: string;
};

const blogDirectory = path.join(process.cwd(), "content", "blog");

function parseFrontMatter(fileContents: string) {
  const frontMatterMatch = fileContents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    throw new Error("Blog post is missing front matter.");
  }

  const data = Object.fromEntries(
    frontMatterMatch[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");

        if (separator < 1) {
          throw new Error(`Invalid blog front matter line: ${line}`);
        }

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

        return [key, value];
      })
  );

  return { data, body: frontMatterMatch[2].trim() };
}

function requireField(data: Record<string, string>, field: string, file: string) {
  const value = data[field]?.trim();

  if (!value) {
    throw new Error(`Blog post ${file} is missing ${field}.`);
  }

  return value;
}

export function getAllBlogPosts(): BlogPost[] {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  return fs
    .readdirSync(blogDirectory)
    .filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md")
    .map((file) => {
      const { data, body } = parseFrontMatter(fs.readFileSync(path.join(blogDirectory, file), "utf8"));

      return {
        title: requireField(data, "title", file),
        date: requireField(data, "date", file),
        slug: requireField(data, "slug", file),
        excerpt: requireField(data, "excerpt", file),
        author: data.author?.trim() || "Paul McNally",
        tag: data.tag?.trim() || undefined,
        featuredImage: data.featuredImage?.trim() || undefined,
        featuredImageAlt: data.featuredImageAlt?.trim() || undefined,
        body
      } satisfies BlogPost;
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getBlogPostBySlug(slug: string) {
  return getAllBlogPosts().find((post) => post.slug === slug);
}
