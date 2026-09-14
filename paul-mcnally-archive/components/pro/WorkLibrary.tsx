"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProfessionalSummary } from "../../lib/professional";
import { filterWorkArticles, getWorkFilterOptions, type WorkFilters, type WorkSort } from "../../lib/workSearch";
import { PortfolioCard } from "../PortfolioCard";
import { ArticleCard } from "./ArticleCard";

type WorkLibraryProps = {
  articles: ProfessionalSummary[];
  edition?: "pro" | "micronet";
};

const defaultFilters: WorkFilters = {
  query: "",
  publication: "",
  topic: "",
  sort: "newest"
};

export function WorkLibrary({ articles, edition = "pro" }: WorkLibraryProps) {
  const [{ query, publication, topic, sort }, setFilters] = useState<WorkFilters>(defaultFilters);
  const { publications, topics } = useMemo(() => getWorkFilterOptions(articles), [articles]);
  const results = useMemo(
    () => filterWorkArticles(articles, { query, publication, topic, sort }),
    [articles, publication, query, sort, topic]
  );
  const hasFilters = Boolean(query || publication || topic || sort !== "newest");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const suppliedPublication = params.get("publication") || "";
    const suppliedTopic = params.get("topic") || "";

    setFilters({
      query: params.get("q") || "",
      publication: publications.includes(suppliedPublication) ? suppliedPublication : "",
      topic: topics.includes(suppliedTopic) ? suppliedTopic : "",
      sort: params.get("sort") === "oldest" ? "oldest" : "newest"
    });
  }, [publications, topics]);

  function updateFilters(next: Partial<WorkFilters>) {
    const updated = { query, publication, topic, sort, ...next };
    const url = new URL(window.location.href);
    const params: Array<[keyof WorkFilters, string, string]> = [
      ["query", "q", updated.query.trim()],
      ["publication", "publication", updated.publication],
      ["topic", "topic", updated.topic],
      ["sort", "sort", updated.sort === "oldest" ? "oldest" : ""]
    ];

    params.forEach(([, key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    setFilters(updated);
  }

  function clearFilters() {
    updateFilters(defaultFilters);
  }

  const queryControl = (
    <label className={edition === "pro" ? "pro-search" : "grid gap-2 font-mono text-xs uppercase text-terminal-green md:col-span-2 xl:col-span-1"}>
      Search all work
      <input
        className={edition === "micronet" ? "min-h-12 border border-terminal-cyan/60 bg-terminal-black px-3 font-mono text-sm text-terminal-paper outline-none placeholder:text-terminal-paper/40 focus:border-terminal-yellow" : undefined}
        type="search"
        value={query}
        onChange={(event) => updateFilters({ query: event.target.value })}
        placeholder="Title, subject or keyword"
      />
    </label>
  );

  const publicationControl = (
    <label className={edition === "micronet" ? "grid gap-2 font-mono text-xs uppercase text-terminal-green" : undefined}>
      Publication
      <select
        className={edition === "micronet" ? "min-h-12 border border-terminal-cyan/60 bg-terminal-black px-3 font-mono text-sm text-terminal-paper outline-none focus:border-terminal-yellow" : undefined}
        value={publication}
        onChange={(event) => updateFilters({ publication: event.target.value })}
      >
        <option value="">All publications</option>
        {publications.map((name) => <option key={name}>{name}</option>)}
      </select>
    </label>
  );

  const topicControl = (
    <label className={edition === "micronet" ? "grid gap-2 font-mono text-xs uppercase text-terminal-green" : undefined}>
      Topic
      <select
        className={edition === "micronet" ? "min-h-12 border border-terminal-cyan/60 bg-terminal-black px-3 font-mono text-sm text-terminal-paper outline-none focus:border-terminal-yellow" : undefined}
        value={topic}
        onChange={(event) => updateFilters({ topic: event.target.value })}
      >
        <option value="">All topics</option>
        {topics.map((name) => <option key={name}>{name}</option>)}
      </select>
    </label>
  );

  const sortControl = (
    <label className={edition === "micronet" ? "grid gap-2 font-mono text-xs uppercase text-terminal-green" : undefined}>
      Sort by
      <select
        className={edition === "micronet" ? "min-h-12 border border-terminal-cyan/60 bg-terminal-black px-3 font-mono text-sm text-terminal-paper outline-none focus:border-terminal-yellow" : undefined}
        value={sort}
        onChange={(event) => updateFilters({ sort: event.target.value as WorkSort })}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </label>
  );

  if (edition === "micronet") {
    return (
      <section aria-label="Complete published work">
        <div className="portfolio-console">
          <div className="portfolio-console-header">
            <p>UNIFIED INDEX CONTROL</p>
            <p className="text-terminal-green">{articles.length} ARTICLE FILES ONLINE</p>
          </div>
          <div className="grid gap-5 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-4">
            {queryControl}
            {publicationControl}
            {topicControl}
            {sortControl}
          </div>
          <div className="portfolio-console-footer">
            <p>SHOWING <span className="text-terminal-yellow">{results.length}</span> OF {articles.length} FILES</p>
            {hasFilters ? <button className="text-terminal-yellow hover:text-terminal-paper" onClick={clearFilters} type="button">CLEAR FILTERS</button> : <p>FILTERS: NONE</p>}
          </div>
        </div>

        {results.length ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {results.map((article) => <PortfolioCard key={`${article.kind}/${article.slug}`} piece={article} />)}
          </div>
        ) : (
          <div className="mt-6 border border-terminal-red/70 bg-terminal-black p-8 font-mono uppercase text-terminal-paper">
            <p className="text-terminal-red">NO MATCHING ARTICLES</p>
            <p className="mt-3 text-sm text-terminal-paper/75">Try another keyword, publication or topic.</p>
            <button className="mt-5 min-h-11 border border-terminal-yellow px-4 text-terminal-yellow hover:bg-terminal-yellow hover:text-terminal-black" onClick={clearFilters} type="button">Clear filters</button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Published work">
      <h2 className="sr-only">Published work</h2>
      <div className="pro-library-tools">
        {queryControl}
        {publicationControl}
        {topicControl}
        {sortControl}
      </div>
      <p className="pro-results" role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "piece" : "pieces"}{hasFilters ? " found" : " in the collection"}
      </p>
      {results.length ? (
        <div className="pro-work-grid">
          {results.map((article) => <ArticleCard article={article} key={`${article.kind}/${article.slug}`} />)}
        </div>
      ) : (
        <div className="pro-empty">
          <h2>No matching work</h2>
          <p>Try a different title, topic or publication.</p>
          <button className="pro-button" onClick={clearFilters}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
