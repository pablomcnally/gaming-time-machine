import Link from "next/link";
import type { BlogPost } from "../lib/blog";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(date));
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group grid overflow-hidden border border-terminal-cyan/50 bg-terminal-black/85 shadow-terminal transition hover:-translate-y-1 hover:border-terminal-yellow">
      {post.featuredImage ? (
        <Link href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt || ""}
            className="aspect-[3/2] w-full border-b border-terminal-cyan/30 object-cover transition duration-300 group-hover:scale-[1.015]"
            loading="lazy"
          />
        </Link>
      ) : (
        <div className="home-portfolio-placeholder aspect-[3/2] border-b border-terminal-cyan/30" aria-hidden="true">
          <span>INDEPENDENT TRANSMISSION</span>
          <strong>BLOG FILE</strong>
          <span>PLABLONET 601</span>
        </div>
      )}

      <div className="flex flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase">
          <span className="text-terminal-green">Independent</span>
          {post.tag ? <span className="text-terminal-yellow">{post.tag}</span> : null}
          <span aria-hidden="true" className="text-terminal-paper/50">//</span>
          <time className="text-terminal-cyan" dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
        <h2 className="mt-4 font-mono text-2xl uppercase leading-tight text-terminal-yellow">
          <Link href={`/blog/${post.slug}`} className="outline-none focus-visible:ring-2 focus-visible:ring-terminal-yellow">
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 font-mono text-xs uppercase text-terminal-paper/70">By {post.author}</p>
        <Link
          className="mt-4 inline-flex min-h-11 items-center self-start border border-terminal-cyan/60 px-4 font-mono text-sm uppercase text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow"
          href={`/blog/${post.slug}`}
        >
          Read transmission
        </Link>
      </div>
    </article>
  );
}
