import Link from "next/link";
import { getPortfolioPageEntries, type ReviewCategory } from "../lib/portfolio";
import { PageContainer } from "./PageContainer";
import { PortfolioCard } from "./PortfolioCard";
import { TeletextDirectory } from "./TeletextDirectory";

const categoryDetails: Record<ReviewCategory, { code: string; title: string; intro: string; emptyLabel: string }> = {
  games: {
    code: "702",
    title: "Game Reviews",
    intro: "Reviews of games across current systems, old machines and everything interesting in between.",
    emptyLabel: "game reviews"
  },
  tech: {
    code: "703",
    title: "Tech Reviews",
    intro: "Reviews of hardware, accessories and technology viewed through a practical editorial lens.",
    emptyLabel: "tech reviews"
  }
};

export function ReviewCategoryIndex({ category }: { category: ReviewCategory }) {
  const details = categoryDetails[category];
  const entries = getPortfolioPageEntries("reviews").filter((entry) => entry.piece.category === category);

  return (
    <PageContainer eyebrow={`Service page ${details.code}`} title={details.title} intro={details.intro}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-terminal-cyan/35 pb-5 font-mono text-sm uppercase">
        <p className="text-terminal-green">{entries.length.toString().padStart(2, "0")} review file{entries.length === 1 ? "" : "s"} online</p>
        <Link href="/reviews" className="text-terminal-cyan hover:text-terminal-yellow">Reviews hub &gt;</Link>
      </div>

      {entries.length ? (
        <>
          <TeletextDirectory
            id={`${category}-reviews-directory-heading`}
            indexCode={details.code}
            label={details.title}
            entries={entries.map(({ number, href, piece }) => ({ number, href, title: piece.title }))}
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {entries.map(({ piece }) => <PortfolioCard key={piece.slug} piece={piece} />)}
          </div>
        </>
      ) : (
        <section className="viewdata-box max-w-3xl p-6 font-mono uppercase md:p-8" aria-labelledby={`${category}-reviews-empty-title`}>
          <p className="text-terminal-green">Directory ready // awaiting first review transmission</p>
          <h2 id={`${category}-reviews-empty-title`} className="mt-4 text-2xl text-terminal-yellow">No {details.emptyLabel} are online yet.</h2>
          <p className="mt-4 max-w-2xl font-sans text-base normal-case leading-7 text-terminal-paper/85">
            New review files will appear here when original copy is added to the archive.
          </p>
        </section>
      )}
    </PageContainer>
  );
}
