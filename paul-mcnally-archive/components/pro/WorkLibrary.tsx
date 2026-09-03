"use client";

import { useMemo, useState } from "react";
import type { ProfessionalSummary } from "../../lib/professional";
import { ArticleCard } from "./ArticleCard";

export function WorkLibrary({ articles }: { articles: ProfessionalSummary[] }) {
  const [query, setQuery] = useState("");
  const [publication, setPublication] = useState("");
  const [sort, setSort] = useState("newest");
  const publications = Array.from(new Set(articles.map((article) => article.publication))).sort();
  const results = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return articles.filter((article) => {
      const text = `${article.title} ${article.excerpt} ${article.publication} ${article.tag || ""}`.toLocaleLowerCase();
      return (!publication || article.publication === publication) && words.every((word) => text.includes(word));
    }).sort((a, b) => sort === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  }, [articles, query, publication, sort]);

  return <section aria-label="Published work">
    <h2 className="sr-only">Published work</h2>
    <div className="pro-library-tools">
      <label className="pro-search">Search work<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, topic or publication" /></label>
      <label>Publication<select value={publication} onChange={(event) => setPublication(event.target.value)}>
        <option value="">All publications</option>{publications.map((name) => <option key={name}>{name}</option>)}
      </select></label>
      <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
    </div>
    <p className="pro-results" role="status" aria-live="polite">{results.length} {results.length === 1 ? "piece" : "pieces"}{query || publication ? " found" : " in the collection"}</p>
    {results.length ? <div className="pro-work-grid">{results.map((article) => <ArticleCard article={article} key={`${article.kind}/${article.slug}`} />)}</div> : <div className="pro-empty">
      <h2>No matching work</h2><p>Try a different title, topic or publication.</p>
      <button className="pro-button" onClick={() => { setQuery(""); setPublication(""); }}>Clear filters</button>
    </div>}
  </section>;
}
