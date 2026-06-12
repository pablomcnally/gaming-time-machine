import type { MetadataRoute } from "next";
import { archiveItems } from "../data/archive";
import { careerEntries } from "../data/career";
import { getAllPosts } from "../lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://paul-mcnally-archive.vercel.app";
  const now = new Date();
  const pages = ["", "/about", "/career", "/writing", "/archive", "/contact", "/micronet-800", "/system-status"];

  return [
    ...pages.map((page) => ({
      url: `${siteUrl}${page}`,
      lastModified: now
    })),
    ...getAllPosts().map((post) => ({
      url: `${siteUrl}/writing/${post.slug}`,
      lastModified: new Date(post.date)
    })),
    ...archiveItems.slice(0, 1).map(() => ({
      url: `${siteUrl}/archive`,
      lastModified: now
    })),
    ...careerEntries.slice(0, 1).map(() => ({
      url: `${siteUrl}/career`,
      lastModified: now
    }))
  ];
}
