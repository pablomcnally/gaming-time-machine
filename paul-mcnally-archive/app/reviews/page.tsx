import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "../../components/PageContainer";
import { getAllPortfolioPieces, type ReviewCategory } from "../../lib/portfolio";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Paul McNally's game and technology review archive."
};

const reviewDirectories: Array<{ category: ReviewCategory; code: string; label: string; href: string; description: string }> = [
  { category: "games", code: "702", label: "Game Reviews", href: "/reviews/games", description: "Games across modern, retro and unusual platforms." },
  { category: "tech", code: "703", label: "Tech Reviews", href: "/reviews/tech", description: "Hardware, accessories and practical technology." }
];

export default function ReviewsPage() {
  const reviews = getAllPortfolioPieces("reviews");

  return (
    <PageContainer
      eyebrow="Service page 701"
      title="Reviews"
      intro="Critical writing split into dedicated game and technology directories, ready for future archive files."
    >
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-terminal-cyan/35 pb-5 font-mono text-sm uppercase">
        <p className="text-terminal-green">{reviews.length.toString().padStart(2, "0")} review file{reviews.length === 1 ? "" : "s"} online</p>
        <p className="text-terminal-cyan">Channel 701 // Reviews hub</p>
      </div>

      <section className="viewdata-box max-w-4xl" aria-labelledby="reviews-directories-heading">
        <div className="viewdata-box-title px-4 py-2 text-base sm:text-xl">
          <h2 id="reviews-directories-heading">Pablonet Reviews Directories</h2>
        </div>
        <div className="grid gap-px bg-terminal-cyan/25">
          {reviewDirectories.map((directory) => {
            const count = reviews.filter((review) => review.category === directory.category).length;

            return (
              <Link className="home-directory-link min-h-20" href={directory.href} key={directory.category} aria-label={`Page ${directory.code}: ${directory.label}, ${count} reviews`}>
                <span>
                  <strong className="block text-terminal-yellow">{directory.code}: {directory.label}</strong>
                  <span className="mt-1 block font-sans text-sm normal-case text-terminal-paper/75">{directory.description}</span>
                </span>
                <span>{count.toString().padStart(2, "0")} reviews</span>
              </Link>
            );
          })}
        </div>
      </section>

      {!reviews.length ? (
        <p className="mt-6 max-w-3xl border-l-2 border-terminal-green pl-4 font-mono text-sm uppercase leading-6 text-terminal-green">
          Reviews service online // no review files transmitted yet
        </p>
      ) : null}
    </PageContainer>
  );
}
