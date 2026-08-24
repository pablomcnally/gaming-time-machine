import type { Metadata } from "next";
import { BlogPostPage } from "../../../components/BlogPostPage";
import { getAllBlogPosts, getBlogPostBySlug } from "../../../lib/blog";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) return { title: "Blog post not found" };

  const images = post.featuredImage ? [{ url: post.featuredImage, alt: post.featuredImageAlt || "" }] : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images
    },
    twitter: {
      card: post.featuredImage ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : undefined
    }
  };
}

export default async function BlogArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  return <BlogPostPage slug={slug} />;
}
