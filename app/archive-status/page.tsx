import type { Metadata } from "next";
import { exhibitStatusLabels, getArchiveWorkflowSummary } from "../../data/archive";

export const metadata: Metadata = {
  title: "Archive Status | Gaming Time Machine",
  description: "Curator workflow status for Gaming Time Machine exhibits.",
  robots: {
    index: false,
    follow: false
  }
};

export default function ArchiveStatusPage() {
  const summary = getArchiveWorkflowSummary();
  const years = Object.keys(summary.byYear).map(Number).sort((left, right) => left - right);
  const showLocalCuratorTools = process.env.NODE_ENV === "development";

  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="border-b border-black/10 bg-zinc-950 px-5 py-12 text-stone-50 md:px-8">
        <div className="mx-auto max-w-7xl">
          <a href="/" className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200 transition hover:text-amber-100">
            Gaming Time Machine
          </a>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.32em] text-red-300">Curator workflow</p>
          <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">Archive Status</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
            Editorial tracking for exhibit drafts, human-edited entries, and verified monthly archive panels.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {showLocalCuratorTools ? (
              <a
                href="/curator/exhibits"
                className="border border-amber-200/40 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-amber-200 transition hover:border-amber-100 hover:text-amber-100"
              >
                Exhibit Editor
              </a>
            ) : null}
            <a
              href="/logo-gallery"
              className="border border-amber-200/40 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-amber-200 transition hover:border-amber-100 hover:text-amber-100"
            >
              Logo Gallery
            </a>
          </div>
        </div>
      </header>

      <section className="border-b border-black/10 bg-[#e7efe7] px-5 py-8 md:px-8" aria-label="Archive totals">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Total Exhibits</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{summary.totalExhibits}</p>
          </article>
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">AI Draft</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{summary.statusCounts["ai-draft"]}</p>
          </article>
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Human Edited</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{summary.statusCounts["human-edited"]}</p>
          </article>
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Verified</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{summary.statusCounts.verified}</p>
          </article>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16" aria-label="Exhibits by year">
        <div className="mx-auto grid max-w-7xl gap-10">
          {years.map((year) => (
            <section key={year} className="grid gap-5 border-t border-black/10 pt-8 md:grid-cols-[12rem_1fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-700">Year drawer</p>
                <h2 className="mt-3 font-display text-4xl text-zinc-950">{year}</h2>
              </div>
              <div className="grid gap-3">
                {summary.byYear[year].map((record) => (
                  <article key={`${record.year}-${record.monthId}`} className="grid gap-4 border border-black/10 bg-[#fbf8ef] p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <a href={record.href} className="font-display text-2xl text-zinc-950 transition hover:text-red-700">
                        {record.label}
                      </a>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">
                        Last edited {record.exhibit.lastEdited}. {record.exhibit.editorNotes[0] ?? "No editor notes recorded."}
                      </p>
                    </div>
                    <span className="inline-flex w-fit border border-zinc-950/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-700">
                      {exhibitStatusLabels[record.exhibit.status]}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
