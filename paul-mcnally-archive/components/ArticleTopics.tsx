import Link from "next/link";
import { getArticleTopics, type TopicArticle } from "../lib/topics";
export function ArticleTopics({ article, pro = false }: { article: TopicArticle; pro?: boolean }) {
  const matched = getArticleTopics(article);
  if (!matched.length) return null;
  return <nav className="article-topics" aria-label="Article topics"><span>Explore more:</span>{matched.map((topic) => <Link href={`${pro ? "/pro" : ""}/topics/${topic.slug}`} key={topic.slug}>{topic.title}</Link>)}</nav>;
}
