import type { Metadata } from "next";
import { PageContainer } from "../../components/PageContainer";
import { PostCard } from "../../components/PostCard";
import { getAllPosts, getPostCategories } from "../../lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description: "Articles and sample posts from Paul McNally's personal archive."
};

export default function WritingPage() {
  const posts = getAllPosts();
  const categories = getPostCategories();

  return (
    <PageContainer
      eyebrow="Service page 400"
      title="Writing Files"
      intro="Markdown-driven posts for essays, updates, archive notes and working samples. Add a file, fill in the front matter, and the site does the rest."
    >
      <div className="mb-7 flex flex-wrap gap-2">
        {categories.map((category) => (
          <span key={category} className="border border-terminal-green/50 bg-terminal-black px-3 py-2 font-mono text-xs uppercase text-terminal-green">
            {category}
          </span>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </PageContainer>
  );
}
