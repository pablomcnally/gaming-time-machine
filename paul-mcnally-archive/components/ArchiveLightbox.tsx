"use client";

import type { ArchiveItem } from "../data/archive";

export function ArchiveLightbox({ item, onClose }: { item: ArchiveItem | null; onClose: () => void }) {
  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-5 py-8" role="dialog" aria-modal="true" aria-label={item.title}>
      <div className="max-h-full w-full max-w-4xl overflow-auto border border-terminal-yellow bg-terminal-black p-5 shadow-terminal md:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-terminal-yellow/50 pb-4">
          <div>
            <p className="font-mono text-xs uppercase text-terminal-green">{item.year} // {item.publication}</p>
            <h3 className="mt-2 font-mono text-3xl uppercase text-terminal-yellow">{item.title}</h3>
          </div>
          <button className="border border-terminal-red px-3 py-2 font-mono text-sm uppercase text-terminal-red" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <img src={item.image} alt="" className="mt-5 aspect-[16/9] w-full border border-terminal-cyan/40 object-cover" />
        <p className="mt-5 text-lg leading-8 text-terminal-paper">{item.caption}</p>
        {item.externalLink ? (
          <a className="mt-5 inline-flex border border-terminal-cyan px-4 py-3 font-mono text-sm uppercase text-terminal-cyan" href={item.externalLink}>
            Open source
          </a>
        ) : null}
      </div>
    </div>
  );
}
