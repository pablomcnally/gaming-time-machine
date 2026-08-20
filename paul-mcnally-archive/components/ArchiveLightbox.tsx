"use client";

import { useEffect } from "react";
import type { ArchiveItem } from "../data/archive";

export function ArchiveLightbox({ item, onClose }: { item: ArchiveItem | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/85 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div className="max-h-full w-full max-w-5xl overflow-auto border border-terminal-yellow bg-terminal-black p-5 shadow-terminal md:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-terminal-yellow/50 pb-4">
          <div>
            <p className="font-mono text-xs uppercase text-terminal-green">{item.year} // {item.publication}</p>
            <h3 className="mt-2 font-mono text-3xl uppercase text-terminal-yellow">{item.title}</h3>
            {item.role ? <p className="mt-2 font-mono text-sm uppercase text-terminal-cyan">{item.role}</p> : null}
          </div>
          <button className="border border-terminal-red px-3 py-2 font-mono text-sm uppercase text-terminal-red" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <img src={item.image} alt="" className="mt-5 max-h-[55vh] w-full border border-terminal-cyan/40 object-contain" />
        <p className="mt-5 text-lg leading-8 text-terminal-paper">{item.caption}</p>
        {item.tags?.length ? (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
            {item.tags.map((tag) => (
              <li key={tag} className="border border-terminal-green/40 px-2 py-1 font-mono text-xs uppercase text-terminal-green">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        {item.externalLink ? (
          <a
            className="mt-5 inline-flex border border-terminal-cyan px-4 py-3 font-mono text-sm uppercase text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow"
            href={item.externalLink}
            rel="noreferrer"
            target="_blank"
          >
            Open source
          </a>
        ) : null}
      </div>
    </div>
  );
}
