import Link from "next/link";
import { PageContainer } from "./PageContainer";
import { PortfolioCard } from "./PortfolioCard";
import { ArticleCard } from "./pro/ArticleCard";
import { getProfessionalSummaries } from "../lib/professional";
import { articlesForTopic, getTopic, topics } from "../lib/topics";

export function TopicDirectory({ pro = false }: { pro?: boolean }) {
  const articles = getProfessionalSummaries();
  const prefix = pro ? "/pro" : "";
  const content = <div className="topic-grid">{topics.map((topic) => <Link className="topic-tile" key={topic.slug} href={`${prefix}/topics/${topic.slug}`}>
    <span>{articlesForTopic(topic.slug, articles).length} articles</span><h2>{topic.title}</h2><p>{topic.description}</p><strong>Explore this topic →</strong>
  </Link>)}</div>;
  return pro ? <div className="pro-container pro-page"><header className="pro-page-heading"><p className="pro-eyebrow">Explore the archive</p><h1>Browse by topic</h1><p>Follow an interest across reviews, features and conversations.</p></header>{content}</div>
    : <PageContainer eyebrow="Archive topics" title="Browse by topic" intro="Follow an interest across reviews, features and interviews.">{content}</PageContainer>;
}

export function TopicCollection({ slug, pro = false }: { slug: string; pro?: boolean }) {
  const topic = getTopic(slug)!;
  const articles = articlesForTopic(slug, getProfessionalSummaries());
  const prefix = pro ? "/pro" : "";
  const content = <><Link className={pro ? "pro-text-link" : "text-terminal-cyan"} href={`${prefix}/topics`}>← All topics</Link><p className="my-6">{articles.length} articles in this collection</p><div className={pro ? "pro-work-grid" : "grid gap-6 lg:grid-cols-2"}>{articles.map((article) => pro ? <ArticleCard key={`${article.kind}/${article.slug}`} article={article} /> : <PortfolioCard key={`${article.kind}/${article.slug}`} piece={article} />)}</div></>;
  return pro ? <div className="pro-container pro-page"><header className="pro-page-heading"><p className="pro-eyebrow">Archive topic</p><h1>{topic.title}</h1><p>{topic.description}</p></header>{content}</div>
    : <PageContainer eyebrow="Archive topic" title={topic.title} intro={topic.description}>{content}</PageContainer>;
}
