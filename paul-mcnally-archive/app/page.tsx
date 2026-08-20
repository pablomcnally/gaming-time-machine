import Link from "next/link";
import { StorySoFarPanel } from "../components/StorySoFarPanel";
import { archiveItems } from "../data/archive";
import { homeContent } from "../data/pages";
import { getLatestMusings } from "../lib/musings";

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  })
    .format(new Date(date))
    .replaceAll("/", ".");
}

export default function HomePage() {
  const musings = getLatestMusings(5);
  const featuredItems = archiveItems.filter((item) => item.featured);
  const featuredArchive = [...featuredItems, ...archiveItems.filter((item) => !item.featured)].slice(0, 3);
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
                <Link className="viewdata-command" href="/archive">
                  Browse portfolio <span>[5]</span>
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
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </section>
          </div>

          <section className="mt-6 viewdata-box">
            <div className="viewdata-box-title flex items-center justify-between gap-4 px-4 py-2 text-base sm:text-xl">
              <h2>{homeContent.selectedWorkTitle}</h2>
              <p>[{featuredArchive.length} FILES]</p>
            </div>
            <div className="grid gap-px bg-terminal-cyan/25 md:grid-cols-3">
              {featuredArchive.map((item, index) => (
                <Link
                  key={`${item.title}-${item.year}`}
                  href={`/archive?q=${encodeURIComponent(item.title)}`}
                  className="featured-work group bg-terminal-black p-4"
                >
                  <div className="relative overflow-hidden border border-terminal-paper/55">
                    <img
                      src={item.image}
                      alt=""
                      className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    <span className="absolute left-2 top-2 bg-terminal-black px-2 py-1 text-xs text-terminal-green">
                      FILE {String(index + 1).padStart(3, "0")}
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-terminal-green">
                    {item.year} // {item.publication}
                  </p>
                  <h3 className="mt-2 text-xl leading-tight text-terminal-yellow md:text-2xl">{item.title}</h3>
                  {item.role ? <p className="mt-2 text-sm text-terminal-cyan">{item.role}</p> : null}
                  <p className="mt-3 line-clamp-3 normal-case leading-6 text-terminal-paper/80">{item.caption}</p>
                  <p className="mt-4 text-sm text-terminal-green group-hover:text-terminal-yellow">&gt; Inspect portfolio file</p>
                </Link>
              ))}
            </div>
            <div className="border-t border-terminal-cyan/35 p-4 text-right">
              <Link className="text-terminal-green hover:text-terminal-yellow" href="/archive">
                &gt; Open complete work index [{archiveItems.length}]
              </Link>
            </div>
          </section>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="viewdata-box">
              <div className="viewdata-box-title flex items-center justify-between gap-4 px-4 py-2 text-base sm:text-xl">
                <h2>{homeContent.latestTitle}</h2>
                <p>[LATEST]</p>
              </div>
              <div className="space-y-3 p-4 text-base text-terminal-paper md:text-lg">
                {musings.map((musing) => (
                  <Link key={musing.id} className="dotted-leader hover:text-terminal-yellow" href={musing.href || "/writing"}>
                    <span>{musing.title}</span>
                    <span className="dotted-leader-date">{formatShortDate(musing.date)}</span>
                  </Link>
                ))}
                <Link className="inline-flex pt-2 text-terminal-green hover:text-terminal-yellow" href="/writing">
                  {homeContent.latestCtaLabel}
                </Link>
              </div>
            </section>

            <StorySoFarPanel />
          </div>

          <div className="viewdata-rule mt-7" />
        </div>
      </section>
    </main>
  );
}
