import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPageCode, getBlogPostBySlug, type BlogPost } from "../lib/blog";
import { MarkdownBody } from "./MarkdownBody";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(date));
}

function getReadingTime(post: BlogPost) {
  const words = post.body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function BlogPostPage({ slug }: { slug: string }) {
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const pageCode = getBlogPageCode(slug);
  const relatedPosts = getAllBlogPosts().filter((candidate) => candidate.slug !== post.slug).slice(0, 3);

  return (
    <main className="min-h-screen">
      <section className="border-b border-terminal-cyan/50 bg-terminal-black px-5 py-10 terminal-grid md:py-14">
        <div className={`mx-auto grid max-w-7xl gap-8 ${post.featuredImage ? "lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end" : ""}`}>
          <div>
            <nav aria-label="Breadcrumb" className="font-mono text-sm uppercase text-terminal-green">
              <Link href="/blog" className="hover:text-terminal-yellow">Blog</Link>
              <span aria-hidden="true"> // Page {pageCode} // Independent transmission</span>
            </nav>
            <h1 className="mt-5 max-w-5xl font-mono text-3xl uppercase leading-tight text-terminal-yellow sm:text-4xl md:text-5xl">{post.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-terminal-paper md:text-xl">{post.excerpt}</p>
            <div className="mt-7 flex flex-wrap gap-3 font-mono text-xs uppercase">
              <span className="border border-terminal-green/50 bg-terminal-black px-3 py-2 text-terminal-green">By {post.author}</span>
              {post.tag ? <span className="border border-terminal-yellow/50 bg-terminal-black px-3 py-2 text-terminal-yellow">{post.tag}</span> : null}
              <time className="border border-terminal-cyan/50 bg-terminal-black px-3 py-2 text-terminal-cyan" dateTime={post.date}>{formatDate(post.date)}</time>
              <span className="border border-terminal-yellow/50 bg-terminal-black px-3 py-2 text-terminal-yellow">{getReadingTime(post)} min read</span>
            </div>
          </div>

          {post.featuredImage ? (
            <figure className="viewdata-box overflow-hidden bg-terminal-black/85 p-3 shadow-terminal">
              <img src={post.featuredImage} alt={post.featuredImageAlt || ""} className="aspect-[3/2] w-full border border-terminal-cyan/35 object-cover" />
            </figure>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="article-shell border border-terminal-paper/60 bg-terminal-black/88 p-5 shadow-terminal md:p-8 lg:p-10">
          <div className="mb-8 border-b border-terminal-yellow/50 pb-5 font-mono text-sm uppercase">
            <p className="text-terminal-yellow">Independent transmission</p>
            <p className="mt-2 text-xs leading-5 text-terminal-paper/70">Published directly by the author on {formatDate(post.date)}.</p>
          </div>
          <MarkdownBody className="article-prose portfolio-prose" content={post.body} />
          <footer className="mt-10 border-t border-terminal-cyan/40 pt-6 font-mono text-sm uppercase">
            <p className="text-terminal-green">Transmission complete // end of blog file</p>
          </footer>
        </article>

        <aside className="space-y-5 self-start font-mono text-sm uppercase lg:sticky lg:top-8">
          <section className="viewdata-box p-5">
            <h2 className="text-terminal-green">File data</h2>
            <dl className="mt-5 grid gap-4">
              <div><dt className="text-terminal-cyan">File type</dt><dd className="mt-1 text-terminal-paper">Blog post</dd></div>
              {pageCode ? <div><dt className="text-terminal-cyan">Page code</dt><dd className="mt-1 text-terminal-green">{pageCode}</dd></div> : null}
              <div><dt className="text-terminal-cyan">Byline</dt><dd className="mt-1 text-terminal-yellow">{post.author}</dd></div>
              {post.tag ? <div><dt className="text-terminal-cyan">Tag</dt><dd className="mt-1 text-terminal-paper">{post.tag}</dd></div> : null}
              <div><dt className="text-terminal-cyan">Published</dt><dd className="mt-1 text-terminal-paper">{formatDate(post.date)}</dd></div>
              <div><dt className="text-terminal-cyan">Blog ref</dt><dd className="mt-1 break-words text-terminal-paper">{post.slug}</dd></div>
            </dl>
          </section>

          {relatedPosts.length ? (
            <section className="viewdata-box p-5">
              <h2 className="text-terminal-green">Related posts</h2>
              <div className="mt-5 grid gap-4">
                {relatedPosts.map((related) => (
                  <Link key={related.slug} className="block border-l-2 border-terminal-cyan pl-3 leading-5 text-terminal-paper hover:border-terminal-yellow hover:text-terminal-yellow" href={`/blog/${related.slug}`}>
                    {related.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <Link className="block border border-terminal-green/60 p-4 text-terminal-green hover:border-terminal-yellow hover:text-terminal-yellow" href="/blog">
            &gt; Return to Blog
          </Link>
        </aside>
      </section>
    </main>
  );
}
