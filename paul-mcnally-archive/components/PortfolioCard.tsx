import Link from "next/link";
import type { PortfolioPiece } from "../lib/portfolio";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(date));
}

export function PortfolioCard({ piece }: { piece: PortfolioPiece }) {
  return (
    <article className="group grid overflow-hidden border border-terminal-cyan/50 bg-terminal-black/85 shadow-terminal transition hover:-translate-y-1 hover:border-terminal-yellow">
      <Link href={`/${piece.kind}/${piece.slug}`} aria-label={`Read ${piece.title}`}>
        <img
          src={piece.featuredImage}
          alt={piece.featuredImageAlt}
          className="aspect-[3/2] w-full border-b border-terminal-cyan/30 object-cover transition duration-300 group-hover:scale-[1.015]"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase">
          <span className="text-terminal-green">{piece.publication}</span>
          {piece.tag ? <span className="text-terminal-yellow">{piece.tag}</span> : null}
          <span aria-hidden="true" className="text-terminal-paper/50">//</span>
          <time className="text-terminal-cyan" dateTime={piece.date}>{formatDate(piece.date)}</time>
        </div>
        <h2 className="mt-4 font-mono text-2xl uppercase leading-tight text-terminal-yellow">
          <Link href={`/${piece.kind}/${piece.slug}`} className="outline-none focus-visible:ring-2 focus-visible:ring-terminal-yellow">
            {piece.title}
          </Link>
        </h2>
        <p className="mt-4 flex-1 leading-7 text-terminal-paper/90">{piece.excerpt}</p>
        <p className="mt-5 font-mono text-xs uppercase text-terminal-paper/70">By {piece.author}</p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center self-start border border-terminal-cyan/60 px-4 font-mono text-sm uppercase text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow"
          href={`/${piece.kind}/${piece.slug}`}
        >
          Open archive file
        </Link>
      </div>
    </article>
  );
}
