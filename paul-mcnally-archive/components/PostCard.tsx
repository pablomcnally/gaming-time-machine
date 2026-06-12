import Link from "next/link";
import type { Post } from "../lib/posts";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="grid border border-terminal-cyan/50 bg-terminal-black/85 shadow-terminal transition hover:-translate-y-1 hover:border-terminal-yellow">
      <img src={post.featuredImage} alt="" className="aspect-[16/9] w-full border-b border-terminal-cyan/30 object-cover" loading="lazy" />
      <div className="p-5">
        <div className="flex flex-wrap gap-3 font-mono text-xs uppercase">
          <span className="text-terminal-green">{post.category}</span>
          <time className="text-terminal-cyan" dateTime={post.date}>
            {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(post.date))}
          </time>
        </div>
        <h3 className="mt-4 font-mono text-2xl uppercase leading-tight text-terminal-yellow">
          <Link href={`/writing/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="mt-4 leading-7 text-terminal-paper/90">{post.excerpt}</p>
        <Link className="mt-5 inline-flex font-mono text-sm uppercase text-terminal-cyan hover:text-terminal-yellow" href={`/writing/${post.slug}`}>
          Read file
        </Link>
      </div>
    </article>
  );
}
