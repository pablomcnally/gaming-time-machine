import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "../../../../components/MarkdownBody";
import { ArticleCard, articleLabel, proDate } from "../../../../components/pro/ArticleCard";
import { getProfessionalArticles, getProfessionalArticle, isProfessionalKind } from "../../../../lib/professional";

type Props = { params: Promise<{ kind: string; slug: string }> };

export function generateStaticParams() {
  return getProfessionalArticles().map(({ kind, slug }) => ({ kind, slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind, slug } = await params;
  if (!isProfessionalKind(kind)) return {};
  const article = getProfessionalArticle(kind, slug);
  if (!article) return { title: "Article not found" };
  const images = article.featuredImage ? [{ url: article.featuredImage, alt: article.featuredImageAlt || article.title }] : [];
  return {
    title: article.title, description: article.excerpt,
    // Same author's copy, two presentations: retain the established canonical URL.
    alternates: { canonical: `/${kind}/${slug}` },
    openGraph: { title: article.title, description: article.excerpt, url: `/pro/${kind}/${slug}`, siteName: "Paul McNally", type: "article", publishedTime: article.date, modifiedTime: article.updatedDate || article.date, authors: [article.author], images },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt, images: article.featuredImage ? [article.featuredImage] : [] }
  };
}

export default async function ProfessionalArticlePage({ params }: Props) {
  const { kind, slug } = await params;
  if (!isProfessionalKind(kind)) notFound();
  const article = getProfessionalArticle(kind, slug);
  if (!article) notFound();
  const related = getProfessionalArticles(kind).filter((item) => item.slug !== slug && (!article.category || item.category === article.category)).slice(0, 3);
  const directory = `/pro/${kind}${article.category ? `/${article.category}` : ""}`;
  const minutes = Math.max(1, Math.ceil(article.body.split(/\s+/).length / 220));

  return <div className="pro-container pro-page">
    <nav className="pro-breadcrumb" aria-label="Breadcrumb"><Link href="/pro/work">Work</Link><span aria-hidden="true">/</span><Link href={directory}>{article.category ? `${article.category === "tech" ? "Tech" : "Game"} reviews` : kind}</Link></nav>
    <article>
      <header className="pro-article-heading"><p className="pro-eyebrow">{articleLabel(article)} <span aria-hidden="true">/</span> {article.publication}</p><h1>{article.title}</h1><p className="pro-article-deck">{article.excerpt}</p><div className="pro-byline"><span>By {article.author}</span><time dateTime={article.date}>{proDate(article.date)}</time><span>{minutes} min read</span>{article.updatedDate ? <span>Updated {proDate(article.updatedDate)}</span> : null}</div></header>
      {article.featuredImage ? <figure className="pro-article-image"><img src={article.featuredImage} alt={article.featuredImageAlt || article.title} fetchPriority="high" />{article.imageCredit ? <figcaption>{article.imageCredit}</figcaption> : null}</figure> : null}
      <div className="pro-reading-layout"><aside className="pro-article-context"><p className="pro-eyebrow">{article.sourceUrl ? "Originally published" : "Independent writing"}</p><p>{article.publication}</p>{article.sourceUrl ? <a href={article.sourceUrl} target="_blank" rel="noreferrer">Read the original <span aria-hidden="true">&#8599;</span><span className="sr-only"> (opens in a new tab)</span></a> : null}<Link href={`/${kind}/${slug}`}>Read in Micronet</Link><Link href={directory}>Back to {kind}</Link></aside>
        <div className="pro-reading-copy"><MarkdownBody content={article.body} className="pro-prose" /><footer className="pro-article-end"><p>Written by {article.author}</p>{article.sourceUrl ? <p>Originally published by <a href={article.sourceUrl} target="_blank" rel="noreferrer">{article.publication}</a> on {proDate(article.date)}. Archived here by the author.</p> : <p>Independent writing. Published {proDate(article.date)}.</p>}</footer></div>
      </div>
    </article>
    {related.length ? <section className="pro-section"><div className="pro-section-heading"><h2>More {kind === "blog" ? "from the blog" : kind}</h2><Link className="pro-text-link" href={directory}>View the collection</Link></div><div className="pro-work-grid">{related.map(({ body: _body, ...item }) => <ArticleCard key={item.slug} article={item} />)}</div></section> : null}
  </div>;
}
