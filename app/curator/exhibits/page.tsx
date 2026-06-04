import type { Metadata } from "next";
import { exhibitStatusLabels, getArchiveWorkflowSummary } from "../../../data/archive";
import { LocalCuratorOnly } from "../local-only";

export const metadata: Metadata = {
  title: "Curator Exhibit Editor | Gaming Time Machine",
  description: "Local-only exhibit editing tools for Gaming Time Machine.",
  robots: {
    index: false,
    follow: false
  }
};

export default function CuratorExhibitsPage() {
  if (process.env.NODE_ENV !== "development") {
    return <LocalCuratorOnly />;
  }

  const summary = getArchiveWorkflowSummary();
  const years = Object.keys(summary.byYear).map(Number).sort((left, right) => left - right);

  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="border-b border-black/10 bg-zinc-950 px-5 py-12 text-stone-50 md:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.24em]">
            <a href="/archive-status" className="text-amber-200 transition hover:text-amber-100">
              Archive Status
            </a>
            <a href="/" className="text-stone-400 transition hover:text-amber-100">
              Public Archive
            </a>
          </nav>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.32em] text-red-300">Curator tools</p>
          <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">Exhibit Editor</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Local form editing for monthly exhibit JSON files. Open an exhibit, change structured fields, validate,
            and save without touching raw JSON formatting.
          </p>
        </div>
      </header>

      <section className="border-b border-black/10 bg-[#e7efe7] px-5 py-8 md:px-8" aria-label="Editor totals">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Total Exhibits</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{summary.totalExhibits}</p>
          </article>
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">AI Draft</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{summary.statusCounts["ai-draft"]}</p>
          </article>
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Human Edited / Verified</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">
              {summary.statusCounts["human-edited"] + summary.statusCounts.verified}
            </p>
          </article>
        </div>
      </section>

      <nav
        aria-label="Editor year navigation"
        className="sticky top-0 z-20 border-b border-black/10 bg-[#fbf8ef]/95 px-5 py-4 shadow-exhibit backdrop-blur md:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-red-700">Year index</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {years.map((year) => (
              <a
                key={year}
                href={`#year-${year}`}
                className="shrink-0 border border-zinc-950/15 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700 transition hover:border-red-700 hover:text-red-700"
              >
                {year}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <section className="px-5 py-12 md:px-8 md:py-16" aria-label="Editable exhibits">
        <div className="mx-auto grid max-w-7xl gap-10">
          {years.map((year) => (
            <section
              key={year}
              id={`year-${year}`}
              className="grid scroll-mt-28 gap-5 border-t border-black/10 pt-8 md:grid-cols-[12rem_1fr]"
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-700">Year drawer</p>
                <h2 className="mt-3 font-display text-4xl text-zinc-950">{year}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.byYear[year].map((record) => (
                  <a
                    key={`${record.year}-${record.monthId}`}
                    href={`/curator/exhibits/${record.year}/${record.monthId}`}
                    className="group border border-black/10 bg-[#fbf8ef] p-4 shadow-exhibit transition hover:-translate-y-0.5 hover:border-red-700"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-700">
                      {record.exhibit.museum.accession}
                    </p>
                    <h3 className="mt-3 font-display text-2xl text-zinc-950">{record.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">{record.exhibit.museum.dek}</p>
                    <span className="mt-4 inline-flex border border-zinc-950/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600 transition group-hover:border-red-700 group-hover:text-red-700">
                      {exhibitStatusLabels[record.exhibit.status]}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
