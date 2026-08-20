import Link from "next/link";
import { getAllPortfolioPieces, getPortfolioKindLabel, type PortfolioKind } from "../lib/portfolio";
import { PageContainer } from "./PageContainer";
import { PortfolioCard } from "./PortfolioCard";

const descriptions: Record<PortfolioKind, string> = {
  interviews: "Long-form conversations with the people building games, worlds, technology and culture — preserved here as permanent archive files.",
  features: "Reported features, deep dives and original stories from across games, technology and the culture around them."
};

export function PortfolioIndex({ kind }: { kind: PortfolioKind }) {
  const pieces = getAllPortfolioPieces(kind);
  const label = getPortfolioKindLabel(kind);
  const otherKind = kind === "interviews" ? "features" : "interviews";

  return (
    <PageContainer eyebrow={`Service page ${kind === "interviews" ? "410" : "420"}`} title={label} intro={descriptions[kind]}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-terminal-cyan/35 pb-5 font-mono text-sm uppercase">
        <p className="text-terminal-green">{pieces.length.toString().padStart(2, "0")} archive file{pieces.length === 1 ? "" : "s"} online</p>
        <Link href={`/${otherKind}`} className="text-terminal-cyan hover:text-terminal-yellow">
          Browse {getPortfolioKindLabel(otherKind)} &gt;
        </Link>
      </div>

      {pieces.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {pieces.map((piece) => <PortfolioCard key={piece.slug} piece={piece} />)}
        </div>
      ) : (
        <section className="viewdata-box max-w-3xl p-6 font-mono uppercase md:p-8">
          <p className="text-terminal-green">Directory ready // awaiting first transmission</p>
          <h2 className="mt-4 text-2xl text-terminal-yellow">No {label.toLowerCase()} are online yet.</h2>
          <p className="mt-4 max-w-2xl font-sans text-base normal-case leading-7 text-terminal-paper/85">
            This is a live, browsable section of the archive. New files will appear here as they are added.
          </p>
        </section>
      )}
    </PageContainer>
  );
}
