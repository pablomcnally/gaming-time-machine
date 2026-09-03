import Link from "next/link";
import { getProfessionalSummaries, type ProfessionalKind } from "../../lib/professional";
import type { ReviewCategory } from "../../lib/portfolio";
import { WorkLibrary } from "./WorkLibrary";

export const collectionDetails = {
  work: { title: "Selected work & collected writing", description: "Reporting, conversations and hands-on criticism from across games, technology and culture." },
  features: { title: "Features", description: "The stories behind the games. Long-form reporting on history, preservation and the people who shaped an industry." },
  interviews: { title: "Interviews", description: "Conversations with the people making games, building worlds and doing things differently." },
  reviews: { title: "Reviews", description: "Independent perspective, hands-on experience. Games and technology put through their paces." },
  blog: { title: "Blog", description: "Personal perspectives on journalism, games and the changing business of telling stories." }
};

export function CollectionPage({ kind, category }: { kind?: ProfessionalKind; category?: ReviewCategory }) {
  const all = getProfessionalSummaries();
  const articles = all.filter((article) => (!kind || article.kind === kind) && (!category || article.category === category));
  const details = collectionDetails[kind || "work"];
  return <div className="pro-container pro-page">
    <header className="pro-page-heading"><p className="pro-eyebrow">The portfolio</p><h1>{category ? `${category === "games" ? "Game" : "Tech"} reviews` : details.title}</h1><p>{details.description}</p></header>
    <nav className="pro-collection-tabs" aria-label="Work collections">
      {[{ label: "All work", value: undefined, href: "/pro/work" }, ...(["features", "interviews", "reviews", "blog"] as const).map((value) => ({ label: collectionDetails[value].title, value, href: `/pro/${value}` }))].map((item) => <Link key={item.href} href={item.href} aria-current={item.value === kind ? "page" : undefined}>
        {item.label}<span>{all.filter((article) => !item.value || article.kind === item.value).length}</span>
      </Link>)}
    </nav>
    {kind === "reviews" ? <nav className="pro-subnav" aria-label="Review categories">
      <Link href="/pro/reviews" aria-current={!category ? "page" : undefined}>All reviews</Link>
      <Link href="/pro/reviews/games" aria-current={category === "games" ? "page" : undefined}>Game reviews</Link>
      <Link href="/pro/reviews/tech" aria-current={category === "tech" ? "page" : undefined}>Tech reviews</Link>
    </nav> : null}
    <WorkLibrary key={`${kind || "all"}/${category || "all"}`} articles={articles} />
  </div>;
}
