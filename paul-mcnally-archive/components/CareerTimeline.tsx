"use client";

import { useState } from "react";
import type { CareerEntry } from "../data/career";

export function CareerTimeline({ entries }: { entries: CareerEntry[] }) {
  const [activeYear, setActiveYear] = useState(entries[0]?.year);
  const activeEntry = entries.find((entry) => entry.year === activeYear) ?? entries[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div className="grid gap-2 self-start lg:sticky lg:top-48">
        {entries.map((entry) => (
          <button
            key={entry.year}
            className={`grid min-h-14 grid-cols-[4.5rem_1fr] items-center border px-3 py-2 text-left font-mono uppercase transition ${
              activeYear === entry.year
                ? "border-terminal-yellow bg-terminal-yellow text-terminal-black"
                : "border-terminal-cyan/50 bg-terminal-black/80 text-terminal-paper hover:border-terminal-yellow"
            }`}
            type="button"
            onClick={() => setActiveYear(entry.year)}
          >
            <span className="text-xl">{entry.year}</span>
            <span className="text-xs">{entry.role}</span>
          </button>
        ))}
      </div>

      {activeEntry ? (
        <article className="viewdata-border bg-terminal-black p-5 shadow-terminal md:p-8">
          <img src={activeEntry.image} alt="" className="aspect-[16/9] w-full border border-terminal-cyan/40 object-cover" />
          <p className="mt-6 font-mono text-sm uppercase text-terminal-green">{activeEntry.range}</p>
          <h3 className="mt-3 font-mono text-3xl uppercase text-terminal-yellow md:text-5xl">{activeEntry.company}</h3>
          <p className="mt-3 font-mono text-lg uppercase text-terminal-cyan">{activeEntry.role}</p>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-terminal-paper">{activeEntry.description}</p>
          {activeEntry.link ? (
            <a className="mt-6 inline-flex border border-terminal-cyan px-4 py-3 font-mono text-sm uppercase text-terminal-cyan" href={activeEntry.link}>
              Open external record
            </a>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
