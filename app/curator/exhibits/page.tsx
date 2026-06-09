import type { Metadata } from "next";
import { exhibitStatusLabels, getArchiveWorkflowSummary } from "../../../data/archive";
import { LocalCuratorOnly } from "../local-only";

type CuratorExhibitsSearchParams = Promise<{
  status?: string;
}>;

type WorkflowFilter = "all" | "ai-draft" | "edited";

export const metadata: Metadata = {
  title: "Curator Exhibit Editor | Gaming Time Machine",
  description: "Local-only exhibit editing tools for Gaming Time Machine.",
  robots: {
    index: false,
    follow: false
  }
};

function getWorkflowFilter(status: string | undefined): WorkflowFilter {
  if (status === "ai-draft" || status === "edited") {
    return status;
  }

  return "all";
}

function getFilterHref(filter: WorkflowFilter) {
  return filter === "all" ? "/curator/exhibits" : `/curator/exhibits?status=${filter}`;
}

function getFilterCardClass(isActive: boolean) {
  return [
    "block border p-5 shadow-exhibit transition hover:-translate-y-0.5 hover:border-red-700",
    isActive ? "border-red-700 bg-[#fbf8ef]" : "border-zinc-950/15 bg-[#fbf8ef]"
  ].join(" ");
}

export default async function CuratorExhibitsPage({ searchParams }: { searchParams: CuratorExhibitsSearchParams }) {
  if (process.env.NODE_ENV !== "development") {
    return <LocalCuratorOnly />;
  }

  const { status } = await searchParams;
  const activeFilter = getWorkflowFilter(status);
  const summary = getArchiveWorkflowSummary();
  const allRecords = Object.keys(summary.byYear)
    .map(Number)
    .sort((left, right) => left - right)
    .flatMap((year) => summary.byYear[year]);
  const filteredRecords = allRecords.filter((record) => {
    if (activeFilter === "ai-draft") {
      return record.exhibit.status === "ai-draft";
    }

    if (activeFilter === "edited") {
      return record.exhibit.status === "human-edited" || record.exhibit.status === "verified";
    }

    return true;
  });
  const filteredByYear = filteredRecords.reduce(
    (yearsByRecord, record) => {
      yearsByRecord[record.year] = [...(yearsByRecord[record.year] ?? []), record];

      return yearsByRecord;
    },
    {} as typeof summary.byYear
  );
  const years = Object.keys(filteredByYear).map(Number).sort((left, right) => left - right);
  const filterLabel =
    activeFilter === "ai-draft" ? "AI Draft" : activeFilter === "edited" ? "Human Edited / Verified" : "All Exhibits";

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
          <a href={getFilterHref("all")} aria-current={activeFilter === "all" ? "page" : undefined} className={getFilterCardClass(activeFilter === "all")}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Total Exhibits</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{summary.totalExhibits}</p>
            <span className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-[0.18em] text-red-700">
              {activeFilter === "all" ? "Showing" : "Show all"}
            </span>
          </a>
          <a
            href={getFilterHref("ai-draft")}
            aria-current={activeFilter === "ai-draft" ? "page" : undefined}
            className={getFilterCardClass(activeFilter === "ai-draft")}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">AI Draft</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{summary.statusCounts["ai-draft"]}</p>
            <span className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-[0.18em] text-red-700">
              {activeFilter === "ai-draft" ? "Showing" : "Filter"}
            </span>
          </a>
          <a href={getFilterHref("edited")} aria-current={activeFilter === "edited" ? "page" : undefined} className={getFilterCardClass(activeFilter === "edited")}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Human Edited / Verified</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">
              {summary.statusCounts["human-edited"] + summary.statusCounts.verified}
            </p>
            <span className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-[0.18em] text-red-700">
              {activeFilter === "edited" ? "Showing" : "Filter"}
            </span>
          </a>
        </div>
        <div className="mx-auto mt-5 flex max-w-7xl flex-col gap-2 border border-zinc-950/10 bg-[#fbf8ef]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            Showing {filteredRecords.length} {filterLabel.toLowerCase()} exhibits
          </p>
          {activeFilter !== "all" ? (
            <a href="/curator/exhibits" className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-700 transition hover:text-zinc-950">
              Clear filter
            </a>
          ) : null}
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
                {filteredByYear[year].map((record) => (
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
