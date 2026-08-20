"use client";

import { useEffect, useMemo, useState } from "react";
import { archiveCategories, type ArchiveCategory, type ArchiveItem } from "../data/archive";
import { ArchiveLightbox } from "./ArchiveLightbox";

type CategoryFilter = "all" | ArchiveCategory;

function matchesSearch(item: ArchiveItem, query: string) {
  if (!query) {
    return true;
  }

  const searchable = [
    item.title,
    item.caption,
    item.year,
    item.publication,
    item.role,
    item.category,
    ...(item.tags || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(query.toLowerCase());
}

export function ArchiveGrid({ items, initialCategory }: { items: ArchiveItem[]; initialCategory?: string }) {
  const suppliedCategory = archiveCategories.some((category) => category.id === initialCategory)
    ? (initialCategory as ArchiveCategory)
    : "all";
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(suppliedCategory);
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) => (activeCategory === "all" || item.category === activeCategory) && matchesSearch(item, query.trim())
      ),
    [activeCategory, items, query]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const searchQuery = params.get("q");

    if (archiveCategories.some((archiveCategory) => archiveCategory.id === category)) {
      setActiveCategory(category as ArchiveCategory);
    }

    if (searchQuery) {
      setQuery(searchQuery);
    }
  }, []);

  function changeQuery(value: string) {
    setQuery(value);
    const url = new URL(window.location.href);

    if (value.trim()) {
      url.searchParams.set("q", value);
    } else {
      url.searchParams.delete("q");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function chooseCategory(category: CategoryFilter) {
    setActiveCategory(category);
    const url = new URL(window.location.href);

    if (category === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", category);
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  const filters: Array<{ id: CategoryFilter; label: string; count: number }> = [
    { id: "all", label: "All files", count: items.length },
    ...archiveCategories.map((category) => ({
      ...category,
      count: items.filter((item) => item.category === category.id).length
    }))
  ];

  return (
    <>
      <section className="portfolio-console" aria-label="Portfolio controls">
        <div className="portfolio-console-header">
          <p>INDEX CONTROL</p>
          <p className="text-terminal-green">DATABASE ONLINE</p>
        </div>
        <div className="grid gap-5 p-4 md:p-5">
          <label className="grid gap-2 font-mono text-xs uppercase text-terminal-green">
            Search title, publication, role or tag
            <span className="flex min-h-12 items-center border border-terminal-cyan/60 bg-terminal-black px-3 focus-within:border-terminal-yellow">
              <span className="mr-3 text-terminal-cyan" aria-hidden="true">
                &gt;
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent font-mono text-base text-terminal-paper outline-none placeholder:text-terminal-paper/40"
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="TYPE SEARCH TERM"
                type="search"
                value={query}
              />
              {query ? (
                <button className="ml-3 text-terminal-yellow" onClick={() => changeQuery("")} type="button">
                  CLEAR
                </button>
              ) : null}
            </span>
          </label>

          <div className="flex flex-wrap gap-2" aria-label="Portfolio categories">
            {filters.map((category) => (
              <button
                key={category.id}
                aria-pressed={activeCategory === category.id}
                className={`min-h-11 border px-3 py-2 font-mono text-xs uppercase transition ${
                  activeCategory === category.id
                    ? "border-terminal-yellow bg-terminal-yellow text-terminal-black"
                    : "border-terminal-cyan/50 bg-terminal-black text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow"
                }`}
                type="button"
                onClick={() => chooseCategory(category.id)}
              >
                {category.label} [{category.count}]
              </button>
            ))}
          </div>
        </div>
        <div className="portfolio-console-footer">
          <p>
            SHOWING <span className="text-terminal-yellow">{filteredItems.length}</span> OF {items.length} FILES
          </p>
          <p>{query ? `QUERY: ${query}` : "QUERY: NONE"}</p>
        </div>
      </section>

      {filteredItems.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item, index) => (
            <article
              key={`${item.title}-${item.year}-${index}`}
              className="portfolio-card group grid overflow-hidden border border-terminal-cyan/45 bg-terminal-black/85 shadow-terminal"
            >
              <button
                className="portfolio-card-image relative block overflow-hidden border-b border-terminal-cyan/30 text-left"
                onClick={() => setSelectedItem(item)}
                type="button"
                aria-label={`Inspect ${item.title}`}
              >
                <img
                  src={item.image}
                  alt=""
                  className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <span className="absolute left-3 top-3 bg-terminal-black px-2 py-1 font-mono text-xs uppercase text-terminal-green">
                  FILE {String(index + 1).padStart(3, "0")}
                </span>
                {item.featured ? (
                  <span className="absolute right-3 top-3 bg-terminal-yellow px-2 py-1 font-mono text-xs uppercase text-terminal-black">
                    Featured
                  </span>
                ) : null}
              </button>

              <div className="grid content-start p-5">
                <p className="font-mono text-xs uppercase text-terminal-green">
                  {item.year} // {item.publication}
                </p>
                <h2 className="mt-3 font-mono text-2xl uppercase leading-tight text-terminal-yellow">{item.title}</h2>
                {item.role ? <p className="mt-2 font-mono text-sm uppercase text-terminal-cyan">{item.role}</p> : null}
                <p className="mt-4 line-clamp-4 leading-7 text-terminal-paper/90">{item.caption}</p>
                {item.tags?.length ? (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                    {item.tags.map((tag) => (
                      <li key={tag} className="border border-terminal-green/35 px-2 py-1 font-mono text-xs uppercase text-terminal-green">
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-terminal-cyan/25 p-4">
                <button
                  className="min-h-11 border border-terminal-cyan px-3 py-2 font-mono text-xs uppercase text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow"
                  type="button"
                  onClick={() => setSelectedItem(item)}
                >
                  Inspect file
                </button>
                {item.externalLink ? (
                  <a
                    className="min-h-11 border border-terminal-green px-3 py-2 font-mono text-xs uppercase text-terminal-green hover:border-terminal-yellow hover:text-terminal-yellow"
                    href={item.externalLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open source
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-terminal-red/70 bg-terminal-black p-8 font-mono uppercase text-terminal-paper">
          <p className="text-terminal-red">NO MATCHING FILES</p>
          <p className="mt-3 text-sm text-terminal-paper/75">Clear the search or select a different category.</p>
        </div>
      )}

      <ArchiveLightbox item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
