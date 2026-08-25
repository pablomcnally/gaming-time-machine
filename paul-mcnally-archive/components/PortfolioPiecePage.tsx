import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPortfolioPieces, getPortfolioKindLabel, getPortfolioPageCode, getPortfolioPieceBySlug, type PortfolioKind, type PortfolioPiece } from "../lib/portfolio";
import { MarkdownBody } from "./MarkdownBody";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(date));
}

function getReadingTime(piece: PortfolioPiece) {
  const words = piece.body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function PortfolioPiecePage({ kind, slug }: { kind: PortfolioKind; slug: string }) {
  const piece = getPortfolioPieceBySlug(kind, slug);

  if (!piece) {
    notFound();
  }

  const label = getPortfolioKindLabel(kind);
  const pageCode = getPortfolioPageCode(kind, slug);
  const relatedPieces = getAllPortfolioPieces(kind).filter((candidate) => candidate.slug !== piece.slug).slice(0, 3);

  return (
    <main className="min-h-screen">
      <section className="border-b border-terminal-cyan/50 bg-terminal-black px-5 py-10 terminal-grid md:py-14">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="font-mono text-sm uppercase text-terminal-green">
            <Link href={`/${kind}`} className="hover:text-terminal-yellow">{label}</Link>
            <span aria-hidden="true"> // Page {pageCode} // Archive file</span>
          </nav>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
            <div>
              <h1 className="max-w-5xl font-mono text-3xl uppercase leading-tight text-terminal-yellow sm:text-4xl md:text-5xl">{piece.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-terminal-paper md:text-xl">{piece.excerpt}</p>
              <div className="mt-7 flex flex-wrap gap-3 font-mono text-xs uppercase">
                <span className="border border-terminal-green/50 bg-terminal-black px-3 py-2 text-terminal-green">By {piece.author}</span>
                {piece.tag ? <span className="border border-terminal-yellow/50 bg-terminal-black px-3 py-2 text-terminal-yellow">{piece.tag}</span> : null}
                <time className="border border-terminal-cyan/50 bg-terminal-black px-3 py-2 text-terminal-cyan" dateTime={piece.date}>{formatDate(piece.date)}</time>
                {piece.updatedDate ? <span className="border border-terminal-cyan/50 bg-terminal-black px-3 py-2 text-terminal-cyan">Updated {formatDate(piece.updatedDate)}</span> : null}
                <span className="border border-terminal-yellow/50 bg-terminal-black px-3 py-2 text-terminal-yellow">{getReadingTime(piece)} min read</span>
              </div>
              <a
                href={piece.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex min-h-12 items-center border border-terminal-yellow bg-terminal-yellow px-5 font-mono text-sm font-bold uppercase text-terminal-black hover:bg-terminal-paper"
              >
                Read the original on {piece.publication} <span aria-hidden="true" className="ml-2">↗</span>
              </a>
            </div>

            <figure className="viewdata-box overflow-hidden bg-terminal-black/85 p-3 shadow-terminal">
              <img src={piece.featuredImage} alt={piece.featuredImageAlt} className="aspect-[3/2] w-full border border-terminal-cyan/35 object-cover" />
              {piece.imageCredit ? <figcaption className="mt-3 font-mono text-xs uppercase text-terminal-cyan">{piece.imageCredit}</figcaption> : null}
            </figure>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="article-shell border border-terminal-paper/60 bg-terminal-black/88 p-5 shadow-terminal md:p-8 lg:p-10">
          <div className="mb-8 border-b border-terminal-yellow/50 pb-5 font-mono text-sm uppercase">
            <p className="text-terminal-yellow">Permanent archive copy</p>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-terminal-paper/70">
              Originally published by {piece.publication} on {formatDate(piece.date)}{piece.updatedDate ? ` and updated on ${formatDate(piece.updatedDate)}` : ""}. Preserved here by the author for long-term access.
            </p>
          </div>
          <MarkdownBody className="article-prose portfolio-prose" content={piece.body} />
          <footer className="mt-10 border-t border-terminal-cyan/40 pt-6 font-mono text-sm uppercase">
            <p className="text-terminal-green">Transmission complete // end of archive copy</p>
            <a href={piece.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-terminal-cyan hover:text-terminal-yellow">
              Original publication: {piece.publication} <span aria-hidden="true" className="ml-2">↗</span>
            </a>
          </footer>
        </article>

        <aside className="space-y-5 self-start font-mono text-sm uppercase lg:sticky lg:top-8">
          <section className="viewdata-box p-5">
            <h2 className="text-terminal-green">File data</h2>
            <dl className="mt-5 grid gap-4">
              <div><dt className="text-terminal-cyan">File type</dt><dd className="mt-1 text-terminal-paper">{label.slice(0, -1)}</dd></div>
              {pageCode ? <div><dt className="text-terminal-cyan">Page code</dt><dd className="mt-1 text-terminal-green">{pageCode}</dd></div> : null}
              <div><dt className="text-terminal-cyan">Byline</dt><dd className="mt-1 text-terminal-yellow">{piece.author}</dd></div>
              <div><dt className="text-terminal-cyan">Publication</dt><dd className="mt-1 text-terminal-paper">{piece.publication}</dd></div>
              {piece.tag ? <div><dt className="text-terminal-cyan">Tag</dt><dd className="mt-1 text-terminal-paper">{piece.tag}</dd></div> : null}
              <div><dt className="text-terminal-cyan">Published</dt><dd className="mt-1 text-terminal-paper">{formatDate(piece.date)}</dd></div>
              {piece.updatedDate ? <div><dt className="text-terminal-cyan">Updated</dt><dd className="mt-1 text-terminal-paper">{formatDate(piece.updatedDate)}</dd></div> : null}
              <div><dt className="text-terminal-cyan">Archive ref</dt><dd className="mt-1 break-words text-terminal-paper">{piece.slug}</dd></div>
            </dl>
          </section>

          {relatedPieces.length ? (
            <section className="viewdata-box p-5">
              <h2 className="text-terminal-green">Related files</h2>
              <div className="mt-5 grid gap-4">
                {relatedPieces.map((related) => (
                  <Link key={related.slug} className="block border-l-2 border-terminal-cyan pl-3 leading-5 text-terminal-paper hover:border-terminal-yellow hover:text-terminal-yellow" href={`/${kind}/${related.slug}`}>
                    {related.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <Link className="block border border-terminal-green/60 p-4 text-terminal-green hover:border-terminal-yellow hover:text-terminal-yellow" href={`/${kind}`}>
            &gt; Return to {label}
          </Link>
        </aside>
      </section>
    </main>
  );
}
