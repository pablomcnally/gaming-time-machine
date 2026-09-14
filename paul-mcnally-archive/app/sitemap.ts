import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "../lib/blog";
import { getAllPortfolioPieces } from "../lib/portfolio";
import { getAllPosts } from "../lib/posts";
import { SITE_URL } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const portfolioPieces = getAllPortfolioPieces();
  const blogPosts = getAllBlogPosts();
  const writingPosts = getAllPosts();
  const newestContentDate = [
    ...portfolioPieces.map((piece) => piece.updatedDate || piece.date),
    ...blogPosts.map((post) => post.date),
    ...writingPosts.map((post) => post.date)
  ].sort((left, right) => right.localeCompare(left))[0];
  const collectionModified = new Date(`${newestContentDate}T00:00:00Z`);
  const pages = ["", "/about", "/career", "/writing", "/opinion", "/interviews", "/features", "/blog", "/reviews", "/reviews/games", "/reviews/tech", "/work", "/contact", "/micronet-800", "/system-status", "/pro", "/pro/work", "/pro/about", "/pro/contact", "/pro/features", "/pro/interviews", "/pro/opinion", "/pro/reviews", "/pro/reviews/games", "/pro/reviews/tech", "/pro/blog"];

  return [
    ...pages.map((page) => ({
      url: `${SITE_URL}${page}`,
      lastModified: collectionModified
    })),
    ...writingPosts.map((post) => ({
      url: `${SITE_URL}/writing/${post.slug}`,
      lastModified: new Date(post.date)
    })),
    ...portfolioPieces.map((piece) => ({
      url: `${SITE_URL}/${piece.kind}/${piece.slug}`,
      lastModified: new Date(piece.updatedDate || piece.date)
    })),
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date)
    }))
  ];
}
