"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { archiveCategories, type ArchiveCategory, type ArchiveItem } from "../data/archive";
import { ArchiveLightbox } from "./ArchiveLightbox";

export function ArchiveGrid({ items, initialCategory }: { items: ArchiveItem[]; initialCategory?: string }) {
  const initial = archiveCategories.some((category) => category.id === initialCategory) ? (initialCategory as ArchiveCategory) : "magazines";
  const [activeCategory, setActiveCategory] = useState<ArchiveCategory>(initial);
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const filteredItems = useMemo(() => items.filter((item) => item.category === activeCategory), [activeCategory, items]);

  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get("category");

    if (archiveCategories.some((archiveCategory) => archiveCategory.id === category)) {
      setActiveCategory(category as ArchiveCategory);
    }
  }, []);

  return (
    <>
      <div className="mb-7 flex flex-wrap gap-2" role="tablist" aria-label="Archive categories">
        {archiveCategories.map((category) => (
          <button
            key={category.id}
            className={`min-h-11 border px-4 py-3 font-mono text-xs uppercase transition ${
              activeCategory === category.id
                ? "border-terminal-yellow bg-terminal-yellow text-terminal-black"
                : "border-terminal-cyan/50 bg-terminal-black text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow"
            }`}
            type="button"
            onClick={() => {
              setActiveCategory(category.id);
              window.history.replaceState(null, "", `/archive?category=${category.id}`);
            }}
          >
            [ {category.label} ]
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <article key={`${item.title}-${item.year}`} className="border border-terminal-cyan/45 bg-terminal-black/85 shadow-terminal">
            <img src={item.image} alt="" className="aspect-[4/3] w-full border-b border-terminal-cyan/30 object-cover" loading="lazy" />
            <div className="p-5">
              <p className="font-mono text-xs uppercase text-terminal-green">{item.year} // {item.publication}</p>
              <h3 className="mt-3 font-mono text-2xl uppercase leading-tight text-terminal-yellow">{item.title}</h3>
              <p className="mt-4 leading-7 text-terminal-paper/90">{item.caption}</p>
              <button
                className="mt-5 inline-flex border border-terminal-cyan px-4 py-3 font-mono text-sm uppercase text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow"
                type="button"
                onClick={() => setSelectedItem(item)}
              >
                Inspect item
              </button>
            </div>
          </article>
        ))}
      </div>

      <ArchiveLightbox item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
