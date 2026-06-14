import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "../../../components/MarkdownBody";
import { getAllPosts, getPostBySlug, type Post } from "../../../lib/posts";

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

function formatPostDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(date));
}

function getReadingTime(post: Post) {
  const words = post.body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function getRelatedPosts(post: Post) {
  return getAllPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((left, right) => Number(right.category === post.category) - Number(left.category === post.category))
    .slice(0, 3);
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post);

  return (
    <main className="min-h-screen">
      <section className="border-b border-terminal-cyan/50 bg-terminal-black px-5 py-10 terminal-grid md:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div>
            <p className="font-mono text-sm uppercase text-terminal-green">Writing file // {post.category}</p>
            <h1 className="mt-4 max-w-5xl font-mono text-4xl uppercase leading-tight text-terminal-yellow md:text-6xl">{post.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-terminal-paper md:text-xl">{post.excerpt}</p>
            <div className="mt-7 flex flex-wrap gap-3 font-mono text-xs uppercase">
              <time className="border border-terminal-cyan/50 bg-terminal-black px-3 py-2 text-terminal-cyan" dateTime={post.date}>
                {formatPostDate(post.date)}
              </time>
              <span className="border border-terminal-green/50 bg-terminal-black px-3 py-2 text-terminal-green">{getReadingTime(post)} min read</span>
              <span className="border border-terminal-yellow/50 bg-terminal-black px-3 py-2 text-terminal-yellow">Archive ref: {post.slug}</span>
            </div>
          </div>
          <figure className="viewdata-box bg-terminal-black/85 p-3 shadow-terminal">
            <img src={post.featuredImage} alt="" className="aspect-[4/3] w-full border border-terminal-cyan/35 object-cover" />
            <figcaption className="mt-3 font-mono text-xs uppercase text-terminal-cyan">Featured file image // {post.category}</figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="article-shell border border-terminal-paper/60 bg-terminal-black/88 p-5 shadow-terminal md:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-terminal-yellow/50 pb-4 font-mono text-sm uppercase">
            <p className="text-terminal-yellow">Transmission start</p>
            <p className="text-terminal-green">Reader mode // feature</p>
          </div>
          <MarkdownBody className="article-prose" content={post.body} />
        </article>

        <aside className="space-y-5 self-start font-mono text-sm uppercase lg:sticky lg:top-8">
          <section className="viewdata-box p-5">
            <h2 className="text-terminal-green">File Data</h2>
            <dl className="mt-5 grid gap-4">
              <div>
                <dt className="text-terminal-cyan">Published</dt>
                <dd className="mt-1 text-terminal-yellow">{formatPostDate(post.date)}</dd>
              </div>
              <div>
                <dt className="text-terminal-cyan">Category</dt>
                <dd className="mt-1 text-terminal-paper">{post.category}</dd>
              </div>
              <div>
                <dt className="text-terminal-cyan">Length</dt>
                <dd className="mt-1 text-terminal-paper">{getReadingTime(post)} minute read</dd>
              </div>
            </dl>
          </section>

          <section className="viewdata-box p-5">
            <h2 className="text-terminal-green">Related Files</h2>
            <div className="mt-5 grid gap-4">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} className="block border-l-2 border-terminal-cyan pl-3 text-terminal-paper hover:border-terminal-yellow hover:text-terminal-yellow" href={`/writing/${relatedPost.slug}`}>
                  <span className="block text-terminal-cyan">{relatedPost.category}</span>
                  <span className="mt-1 block leading-5">{relatedPost.title}</span>
                </Link>
              ))}
            </div>
          </section>

          <Link className="block border border-terminal-green/60 p-4 text-terminal-green hover:border-terminal-yellow hover:text-terminal-yellow" href="/writing">
            &gt; Return to writing files
          </Link>
        </aside>
      </section>
    </main>
  );
}
