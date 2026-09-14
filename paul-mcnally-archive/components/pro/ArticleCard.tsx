import Image from "next/image";
import Link from "next/link";
import type { ProfessionalSummary } from "../../lib/professional";

export function proDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}

export function articleLabel(article: ProfessionalSummary) {
  if (article.category) return article.category === "games" ? "Game review" : "Tech review";
  if (article.kind === "opinion") return "Opinion piece";
  return article.kind === "blog" ? "Journal" : article.kind === "features" ? "Feature" : "Interview";
}

export function ArticleCard({ article, lead = false, eager = false }: { article: ProfessionalSummary; lead?: boolean; eager?: boolean }) {
  const href = `/pro/${article.kind}/${article.slug}`;
  return <article className={`pro-story ${lead ? "pro-story-lead" : ""}`}>
    <Link href={href} className="pro-story-link">
      <div className="pro-story-image">
        {article.featuredImage
          ? <Image
              src={article.featuredImage}
              alt={article.featuredImageAlt || article.title}
              fill
              sizes={lead ? "(min-width: 1000px) 50vw, 100vw" : "(min-width: 1200px) 360px, (min-width: 700px) 50vw, 100vw"}
              priority={eager}
            />
          : <span className="pro-image-fallback" aria-hidden="true">{articleLabel(article)}</span>}
      </div>
      <div className="pro-story-meta"><span>{articleLabel(article)}</span><span>{article.publication}</span></div>
      <h3>{article.title}</h3>
      {lead ? <p className="pro-story-excerpt">{article.excerpt}</p> : null}
      <time dateTime={article.date}>{proDate(article.date)}</time>
    </Link>
  </article>;
}
