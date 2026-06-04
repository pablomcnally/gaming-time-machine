import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArchiveSelection } from "../../../../../data/archive";
import { LocalCuratorOnly } from "../../../local-only";
import { ExhibitEditor } from "./exhibit-editor";

type CuratorExhibitParams = Promise<{
  year: string;
  month: string;
}>;

export const metadata: Metadata = {
  title: "Edit Exhibit | Gaming Time Machine",
  description: "Local-only structured JSON editor for Gaming Time Machine exhibits.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function CuratorExhibitPage({ params }: { params: CuratorExhibitParams }) {
  if (process.env.NODE_ENV !== "development") {
    return <LocalCuratorOnly />;
  }

  const { year, month } = await params;
  const selectedYear = Number(year);
  const selection = await getArchiveSelection(year, month);
  const exhibit = selection.currentMonth?.exhibit;

  if (!exhibit || selection.selectedYear !== selectedYear) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="border-b border-black/10 bg-zinc-950 px-5 py-12 text-stone-50 md:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.24em]">
            <a href="/curator/exhibits" className="text-amber-200 transition hover:text-amber-100">
              Exhibit Editor
            </a>
            <a href={`/${year}/${month}`} className="text-stone-400 transition hover:text-amber-100">
              View Public Exhibit
            </a>
          </nav>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.32em] text-red-300">{exhibit.museum.accession}</p>
          <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">Edit {exhibit.museum.period}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Structured local editing for <code>data/{year}/{month}.json</code>. The save endpoint writes files only
            during local development.
          </p>
        </div>
      </header>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-7xl">
          <ExhibitEditor exhibit={exhibit} year={selectedYear} month={month} />
        </div>
      </section>
    </main>
  );
}
