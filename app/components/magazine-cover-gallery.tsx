"use client";

import { useEffect, useState } from "react";

export type MagazineCoverItem = {
  id: string;
  publicationName: string;
  issueDate: string;
  curatorNote: string;
  coverImage: string;
  coverImageAlt: string;
};

function MagazineCoverCard({
  cover,
  onOpen
}: {
  cover: MagazineCoverItem;
  onOpen: (cover: MagazineCoverItem) => void;
}) {
  return (
    <article className="grid gap-4 border-t border-black/10 pt-5 md:grid-cols-[13rem_1fr] md:gap-5 md:border-t-0 md:pt-0">
      <button
        type="button"
        className="group relative mx-auto aspect-[3/4] w-full max-w-52 overflow-hidden border border-zinc-950 bg-zinc-950 text-left shadow-exhibit transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-4 focus:ring-offset-[#f3efe4] md:mx-0 md:max-w-none"
        onClick={() => onOpen(cover)}
        aria-label={`Open ${cover.publicationName} ${cover.issueDate} cover image`}
      >
        <img
          src={cover.coverImage}
          alt={cover.coverImageAlt}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute inset-x-0 bottom-0 bg-zinc-950/82 px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-stone-100 md:text-left md:text-[11px] md:tracking-[0.18em]">
          View cover
        </span>
      </button>
      <div className="pb-5 md:self-center md:border-y md:border-black/10 md:py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 md:text-xs md:tracking-[0.24em]">{cover.issueDate}</p>
        <h3 className="mt-3 font-display text-2xl leading-none text-zinc-950 sm:text-3xl">{cover.publicationName}</h3>
        <p className="mt-4 max-w-xl text-base leading-7 text-zinc-700 md:text-lg md:leading-8">{cover.curatorNote}</p>
      </div>
    </article>
  );
}

export function MagazineCoverGallery({ covers }: { covers: MagazineCoverItem[] }) {
  const [selectedCover, setSelectedCover] = useState<MagazineCoverItem | null>(null);

  useEffect(() => {
    if (!selectedCover) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCover(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedCover]);

  return (
    <>
      <div className="grid gap-7 md:gap-9">
        {covers.map((cover) => (
          <MagazineCoverCard key={cover.id} cover={cover} onOpen={setSelectedCover} />
        ))}
      </div>

      {selectedCover ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-zinc-950/88 p-3 backdrop-blur-sm md:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedCover.publicationName} cover image`}
          onClick={() => setSelectedCover(null)}
        >
          <div
            className="grid w-full max-w-5xl gap-3 md:max-h-[92vh] md:grid-cols-[minmax(0,0.85fr)_minmax(18rem,0.55fr)] md:gap-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-h-0 border border-stone-100/20 bg-zinc-950 p-3">
              <img
                src={selectedCover.coverImage}
                alt={selectedCover.coverImageAlt}
                className="mx-auto max-h-[62vh] w-full object-contain md:max-h-[86vh]"
              />
            </div>
            <aside className="self-start border border-stone-100/20 bg-[#fbf8ef] p-5 shadow-exhibit md:p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-red-700 md:text-xs md:tracking-[0.24em]">
                {selectedCover.issueDate}
              </p>
              <h3 className="mt-3 font-display text-3xl leading-none text-zinc-950 md:mt-4 md:text-4xl">
                {selectedCover.publicationName}
              </h3>
              <p className="mt-5 text-base leading-7 text-zinc-600">{selectedCover.curatorNote}</p>
              <button
                type="button"
                className="mt-6 w-full border border-zinc-950 bg-zinc-950 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-stone-50 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 focus:ring-offset-[#fbf8ef] md:mt-7 md:w-auto"
                onClick={() => setSelectedCover(null)}
              >
                Close
              </button>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
