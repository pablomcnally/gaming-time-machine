import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownBody } from "../../../components/MarkdownBody";
import { PageContainer } from "../../../components/PageContainer";
import { TerminalPanel } from "../../../components/TerminalPanel";
import { getAllPosts, getPostBySlug } from "../../../lib/posts";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Writing file not found" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.featuredImage }]
    }
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <PageContainer eyebrow={`Writing // ${post.category}`} title={post.title} intro={post.excerpt}>
      <article className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <TerminalPanel title="ARTICLE BODY" tone="yellow">
          <MarkdownBody content={post.body} />
        </TerminalPanel>
        <aside className="self-start border border-terminal-cyan/50 bg-terminal-black/85 p-5 font-mono text-sm uppercase text-terminal-paper shadow-terminal lg:sticky lg:top-48">
          <img src={post.featuredImage} alt="" className="mb-5 aspect-[4/3] w-full border border-terminal-cyan/40 object-cover" />
          <p className="text-terminal-cyan">Date</p>
          <time className="mt-1 block text-terminal-yellow" dateTime={post.date}>
            {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(post.date))}
          </time>
          <p className="mt-5 text-terminal-cyan">Slug</p>
          <p className="mt-1 break-words text-terminal-green">{post.slug}</p>
        </aside>
      </article>
    </PageContainer>
  );
}
