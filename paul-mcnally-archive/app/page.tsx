import Link from "next/link";
import { StorySoFarPanel } from "../components/StorySoFarPanel";
import { archiveItems } from "../data/archive";
import { homeContent } from "../data/pages";
import { getAllPortfolioPieces, type PortfolioPiece } from "../lib/portfolio";

const homePreviewImages: Record<string, string> = {
  "forgotten-amberstar-review-copy-resurfaced": "/portfolio/home/amberstar-micronet.png",
  "ere-informatique-french-video-game-revolution": "/portfolio/home/ere-informatique-micronet.png",
  "sterre-meijer-skatesterre-interview": "/portfolio/home/sterre-meijer-micronet.png",
  "slipknot-clown-vernearth": "/portfolio/home/slipknot-clown-micronet.png",
  "tim-kitzrow-nba-jam-blitz-mutant-football-league-interview": "/portfolio/home/tim-kitzrow-micronet.png"
};

function formatPortfolioDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}

function HomePortfolioCard({ piece, eager = false }: { piece: PortfolioPiece; eager?: boolean }) {
  const previewImage = homePreviewImages[piece.slug];

  return (
    <Link
      href={`/${piece.kind}/${piece.slug}`}
      className="home-portfolio-card group bg-terminal-black"
      aria-label={`Open ${piece.title}`}
    >
      <div className="home-portfolio-visual">
        {previewImage ? (
          <img
            src={previewImage}
            alt=""
            className="h-full w-full object-cover"
            loading={eager ? "eager" : "lazy"}
          />
        ) : (
          <div className="home-portfolio-placeholder" aria-hidden="true">
            <span>{piece.kind === "features" ? "FEATURE" : "INTERVIEW"} FILE // UNCATALOGUED</span>
            <strong>ARCHIVE SIGNAL</strong>
            <span>PREVIEW IMAGE PENDING</span>
          </div>
        )}
        <span className="home-portfolio-kind">{piece.kind === "features" ? "FEATURE" : "INTERVIEW"}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-terminal-green">{piece.publication}</span>
          <time className="text-terminal-cyan" dateTime={piece.date}>{formatPortfolioDate(piece.date)}</time>
        </div>
        <h3 className="mt-3 text-lg leading-snug text-terminal-yellow sm:text-xl">{piece.title}</h3>
        <p className="mt-3 line-clamp-3 normal-case leading-6 text-terminal-paper/80">{piece.excerpt}</p>
        <span className="mt-5 text-sm text-terminal-green group-hover:text-terminal-yellow">&gt; Open archive file</span>
      </div>
    </Link>
  );
}

function PortfolioBand({
  id,
  title,
  servicePage,
  pieces
}: {
  id: string;
  title: string;
  servicePage: string;
  pieces: PortfolioPiece[];
}) {
  return (
    <section className="mt-6 viewdata-box" aria-labelledby={id}>
      <div className="viewdata-box-title flex items-center justify-between gap-4 px-4 py-2 text-base sm:text-xl">
        <h2 id={id}>{title}</h2>
        <p>[{pieces.length.toString().padStart(2, "0")} FILES]</p>
      </div>
      <div className={`grid gap-px bg-terminal-cyan/25 ${pieces.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {pieces.map((piece, index) => (
          <HomePortfolioCard key={piece.slug} piece={piece} eager={index === 0 && piece.kind === "features"} />
        ))}
      </div>
      <div className="border-t border-terminal-cyan/35 p-4 text-right">
        <Link className="text-terminal-green hover:text-terminal-yellow" href={servicePage}>
          &gt; Open complete {title.toLowerCase()} directory
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  const features = getAllPortfolioPieces("features");
  const interviews = getAllPortfolioPieces("interviews");
  const lastUpdated = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
    .format(new Date())
    .replaceAll("/", ".");

  return (
    <main className="font-mono uppercase">
      <section className="px-4 pb-10 pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="viewdata-rule mb-4" />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-terminal-cyan md:text-sm">
            <p>PAGE 100 // PERSONAL ARCHIVE FRONT PAGE</p>
            <p className="text-terminal-green">HOST STATUS: ONLINE</p>
          </div>

          <h1 className="ascii-masthead" aria-label="Paul McNally">
            <img className="ascii-masthead-full" src="/paul-mcnally-masthead.svg" alt="Paul McNally" />
            <img className="ascii-masthead-mobile" src="/paul-mcnally-mobile-masthead.svg" alt="" aria-hidden="true" />
          </h1>

          <p className="mt-4 text-center text-base text-terminal-green sm:text-lg md:text-2xl">
            {homeContent.taglineParts.map((part, index) => (
              <span key={part}>
                {index > 0 ? <span className="text-terminal-yellow"> &raquo; </span> : null}
                {part}
              </span>
            ))}
          </p>

          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center text-sm text-terminal-blue sm:text-lg md:text-xl">
            <div className="white-rule" />
            <p>{homeContent.welcomeTitle}</p>
            <div className="white-rule" />
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="home-intro-panel">
              <div className="text-lg leading-8 text-terminal-paper md:text-xl md:leading-9">
                {homeContent.introLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="viewdata-command" href="/features">
                  Browse features <span>[5]</span>
                </Link>
                <Link className="viewdata-command" href="/interviews">
                  Browse interviews <span>[4]</span>
                </Link>
                <Link className="viewdata-command" href="/about">
                  {homeContent.readMoreLabel} <span>[2]</span>
                </Link>
              </div>
            </section>

            <section className="status-terminal" aria-label="Connection status">
              <div className="status-terminal-title">
                <h2>{homeContent.status.title}</h2>
                <p>{homeContent.status.state}</p>
              </div>
              <dl className="grid gap-2 p-4 text-sm sm:text-base md:text-lg">
                <div className="status-terminal-row">
                  <dt>User:</dt>
                  <dd>{homeContent.status.user}</dd>
                </div>
                <div className="status-terminal-row">
                  <dt>Location:</dt>
                  <dd>{homeContent.status.location}</dd>
                </div>
                <div className="status-terminal-row">
                  <dt>Service:</dt>
                  <dd>{homeContent.status.service}</dd>
                </div>
                <div className="status-terminal-row">
                  <dt>Updated:</dt>
                  <dd>{lastUpdated}</dd>
                </div>
              </dl>
              <div className="status-terminal-meter" aria-hidden="true">
                {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
              </div>
            </section>
          </div>

          <PortfolioBand id="home-features" title="Features" servicePage="/features" pieces={features} />
          <PortfolioBand id="home-interviews" title="Interviews" servicePage="/interviews" pieces={interviews} />

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <StorySoFarPanel />

            <section className="viewdata-box" aria-labelledby="archive-directories">
              <div className="viewdata-box-title px-4 py-2 text-base sm:text-xl">
                <h2 id="archive-directories">Archive directories</h2>
              </div>
              <div className="grid gap-px bg-terminal-cyan/25">
                <Link className="home-directory-link" href="/features">
                  <span>Features</span>
                  <span>{features.length.toString().padStart(2, "0")} files</span>
                </Link>
                <Link className="home-directory-link" href="/interviews">
                  <span>Interviews</span>
                  <span>{interviews.length.toString().padStart(2, "0")} files</span>
                </Link>
                <Link className="home-directory-link" href="/archive">
                  <span>Complete work index</span>
                  <span>{archiveItems.length.toString().padStart(2, "0")} records</span>
                </Link>
              </div>
            </section>
          </div>

          <div className="viewdata-rule mt-7" />
        </div>
      </section>
    </main>
  );
}
