import { getArchiveStats } from "../../data/archive";

export function MuseumFooter({
  randomExhibitHref,
  sources = []
}: {
  randomExhibitHref: string;
  sources?: { label: string; url: string }[];
}) {
  const archiveStats = getArchiveStats();

  return (
    <>
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-950/20 to-transparent" />

      <footer className="bg-zinc-950 px-5 py-12 text-stone-200 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          {sources.length > 0 ? (
            <div className="grid gap-8 border-b border-stone-100/10 pb-10 md:grid-cols-[0.8fr_2fr]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber-200 md:text-xs md:tracking-[0.28em]">Source shelf</p>
                <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">
                  Exhibit notes are condensed from contemporary release listings, magazine records, and platform context.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    className="border border-stone-100/15 p-4 text-sm leading-6 text-stone-300 transition hover:border-amber-200 hover:text-white"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-8 border-b border-stone-100/10 py-9 md:grid-cols-[1.1fr_0.9fr] md:items-end md:gap-10 md:py-10">
            <section aria-label="Museum closing panel" className="max-w-2xl">
              <p className="font-display text-3xl text-stone-50 md:text-4xl">Gaming Time Machine</p>
              <p className="mt-4 text-sm leading-7 text-stone-400">A digital museum of video game history.</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-200/85 md:text-xs md:tracking-[0.22em]">
                Gaming History, One Month at a Time.
              </p>
              <p className="mt-7 max-w-xl border-l border-amber-200/30 pl-5 text-sm leading-7 text-stone-400">
                This archive is an ongoing effort to preserve what it felt like to be a player at different moments in history.
              </p>
            </section>

            <div className="grid grid-cols-3 gap-3 md:gap-6 md:justify-self-end">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500 md:text-[11px] md:tracking-[0.24em]">Years</p>
                <p className="mt-2 font-display text-3xl text-stone-50 md:text-4xl">{archiveStats.yearsInArchive}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500 md:text-[11px] md:tracking-[0.24em]">Exhibits</p>
                <p className="mt-2 font-display text-3xl text-stone-50 md:text-4xl">{archiveStats.monthlyExhibits}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500 md:text-[11px] md:tracking-[0.24em]">Verified</p>
                <p className="mt-2 font-display text-3xl text-stone-50 md:text-4xl">{archiveStats.verifiedExhibits}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
            <p>Curated by Paul McNally.</p>
            <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-[0.18em] sm:flex sm:flex-wrap sm:tracking-[0.2em]">
              <a href="/" className="transition hover:text-amber-200">Home</a>
              <a href="/about" className="transition hover:text-amber-200">About</a>
              <a href={randomExhibitHref} className="transition hover:text-amber-200">Random Month</a>
              <a href="/#timeline-archive" className="transition hover:text-amber-200">Archive</a>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
