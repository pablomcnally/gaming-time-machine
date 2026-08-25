import type { Metadata } from "next";
import { BlogCard } from "../../components/BlogCard";
import { PageContainer } from "../../components/PageContainer";
import { TeletextDirectory } from "../../components/TeletextDirectory";
import { getBlogPageEntries } from "../../lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Occasional independent writing and personal essays by Paul McNally."
};

export default function BlogPage() {
  const entries = getBlogPageEntries();
  const posts = entries.map((entry) => entry.post);

  return (
    <PageContainer
      eyebrow="Service page 601"
      title="Blog"
      intro="Occasional independent writing, personal essays and thoughts published directly rather than through an outlet."
    >
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-terminal-cyan/35 pb-5 font-mono text-sm uppercase">
        <p className="text-terminal-green">{posts.length.toString().padStart(2, "0")} independent post{posts.length === 1 ? "" : "s"} online</p>
        <p className="text-terminal-cyan">Channel 601 // Personal transmission</p>
      </div>

      {posts.length ? (
        <>
          <TeletextDirectory
            id="blog-directory-heading"
            indexCode="601"
            label="Blog"
            entries={entries.map(({ number, href, post }) => ({ number, href, title: post.title }))}
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {posts.map((post) => <BlogCard key={post.slug} post={post} />)}
          </div>
        </>
      ) : (
        <section className="viewdata-box max-w-3xl p-6 font-mono uppercase md:p-8">
          <p className="text-terminal-green">Blog channel ready // awaiting first transmission</p>
          <h2 className="mt-4 text-2xl text-terminal-yellow">No independent posts are online yet.</h2>
          <p className="mt-4 max-w-2xl font-sans text-base normal-case leading-7 text-terminal-paper/85">
            The first occasional essay or personal note will appear here when it is ready.
          </p>
        </section>
      )}
    </PageContainer>
  );
}
