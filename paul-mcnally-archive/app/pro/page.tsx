import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "../../components/pro/ArticleCard";
import { professionalSelections } from "../../data/professional";
import { aboutContent, homeContent } from "../../data/pages";
import { getProfessionalSummaries } from "../../lib/professional";

export const metadata: Metadata = { title: { absolute: "Paul McNally | Games & Technology Journalist" }, alternates: { canonical: "/pro" } };

export default function ProfessionalHome() {
  const articles = getProfessionalSummaries();
  const curated = professionalSelections.map((slug) => articles.find((article) => article.slug === slug)).filter((article) => article !== undefined);
  const selected = [...curated, ...articles.filter((article) => !curated.some((pick) => pick.slug === article.slug))].slice(0, 3);
  const latest = articles.filter((article) => !selected.some((pick) => pick.slug === article.slug)).slice(0, 3);
  const publications = [
    ...(aboutContent.panels.find((panel) => panel.title === "SELECTED PUBLICATIONS")?.paragraphs.slice(0, 6) || []),
    "ST ACTION", "AMIGA ACTION", "THE MIRROR", "TECHOPEDIA"
  ];

  return <>
    <div className="pro-container">
      <section className="pro-introduction" aria-labelledby="pro-home-title">
        <p className="pro-eyebrow">Games. Technology. Culture.</p>
        <h1 id="pro-home-title">Paul McNally<span className="pro-name-period">.</span></h1>
        <div className="pro-introduction-bottom"><p>{aboutContent.intro}</p><Link className="pro-text-link" href="/pro/about">More about me <span aria-hidden="true">&rarr;</span></Link></div>
      </section>
      <section className="pro-section" aria-labelledby="selected-heading">
        <div className="pro-section-heading"><h2 id="selected-heading">Selected work</h2><Link className="pro-text-link" href="/pro/work">Explore the portfolio <span aria-hidden="true">&rarr;</span></Link></div>
        <div className="pro-selected-grid">{selected.map((article, index) => <ArticleCard article={article} lead={index === 0} eager={index === 0} key={article.slug} />)}</div>
      </section>
    </div>
    <section className="pro-publications" aria-label="Selected publications"><div className="pro-container"><p className="pro-eyebrow">Words in print &amp; online</p><ul>{publications.map((name) => <li key={name}>{name}</li>)}</ul></div></section>
    <div className="pro-container">
      <section className="pro-section" aria-labelledby="recent-heading"><div className="pro-section-heading"><h2 id="recent-heading">From the archive</h2><Link className="pro-text-link" href="/pro/work">All writing <span aria-hidden="true">&rarr;</span></Link></div><div className="pro-work-grid">{latest.map((article) => <ArticleCard key={article.slug} article={article} />)}</div></section>
      <section className="pro-experience-band"><div><p className="pro-eyebrow">An editor&apos;s eye. A writer&apos;s curiosity.</p><h2>From the magazine shelf<br />to the stories that come next.</h2><p>{homeContent.introLines.join(" ")}</p><Link className="pro-text-link" href="/pro/about">The longer story <span aria-hidden="true">&rarr;</span></Link></div><dl>{homeContent.storyStats.slice(0, 3).map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl></section>
    </div>
  </>;
}
