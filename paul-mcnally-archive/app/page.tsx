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
  const featuredArchive = archiveItems.slice(0, 3);
  const lastUpdated = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
    .format(new Date())
    .replaceAll("/", ".");

  return (
    <main className="font-mono uppercase">
      <section className="px-4 pb-8 pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="viewdata-rule mb-5" />
          <h1 className="ascii-masthead" aria-label="Paul McNally">
            <img className="ascii-masthead-full" src="/paul-mcnally-masthead.svg" alt="Paul McNally" />
            <img className="ascii-masthead-mobile" src="/paul-mcnally-mobile-masthead.svg" alt="" aria-hidden="true" />
          </h1>
          <p className="mt-4 text-center text-xl text-terminal-green md:text-2xl">
            {homeContent.taglineParts.map((part, index) => (
              <span key={part}>
                {index > 0 ? <span className="text-terminal-yellow"> &raquo; </span> : null}
                {part}
              </span>
            ))}
          </p>

          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center text-lg text-terminal-blue md:text-xl">
            <div className="white-rule" />
            <p>{homeContent.welcomeTitle}</p>
            <div className="white-rule" />
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="text-xl leading-8 text-terminal-paper md:text-2xl md:leading-10">
              {homeContent.introLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <Link className="mt-7 inline-flex text-terminal-green hover:text-terminal-yellow" href="/about">
                &gt; {homeContent.readMoreLabel} <span className="ml-3 text-terminal-paper">[2]</span>
              </Link>
            </div>

            <section className="border border-dashed border-terminal-paper/80 p-4 text-lg leading-8 md:text-xl">
              <div className="mb-4 flex justify-between gap-4 text-terminal-green">
                <h2>{homeContent.status.title}</h2>
                <p>{homeContent.status.state}</p>
              </div>
              <dl className="grid gap-1">
                <div className="grid grid-cols-[9.5rem_1fr]">
                  <dt className="text-terminal-paper">User:</dt>
                  <dd className="text-terminal-cyan">{homeContent.status.user}</dd>
                </div>
                <div className="grid grid-cols-[9.5rem_1fr]">
                  <dt className="text-terminal-paper">Location:</dt>
                  <dd className="text-terminal-cyan">{homeContent.status.location}</dd>
                </div>
                <div className="grid grid-cols-[9.5rem_1fr]">
                  <dt className="text-terminal-paper">Service:</dt>
                  <dd className="text-terminal-cyan">{homeContent.status.service}</dd>
                </div>
                <div className="grid grid-cols-[9.5rem_1fr]">
                  <dt className="text-terminal-paper">Last updated:</dt>
                  <dd className="text-terminal-cyan">{lastUpdated}</dd>
                </div>
              </dl>
            </section>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="viewdata-box">
              <div className="viewdata-box-title flex items-center justify-between px-4 py-2 text-xl">
                <h2>{homeContent.latestTitle}</h2>
                <p>{homeContent.latestCounter}</p>
              </div>
              <div className="space-y-3 p-4 text-lg text-terminal-paper md:text-xl">
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

            <section className="viewdata-box">
              <div className="viewdata-box-title flex items-center justify-between px-4 py-2 text-xl">
                <h2>{homeContent.selectedWorkTitle}</h2>
                <p>{homeContent.selectedWorkCounter}</p>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-3">
                {featuredArchive.map((item) => (
                  <Link key={item.title} href="/archive" className="group">
                    <img
                      src={item.image}
                      alt=""
                      className="aspect-[4/3] w-full border border-terminal-paper/70 object-cover transition group-hover:border-terminal-yellow"
                      loading="lazy"
                    />
                    <h3 className="mt-3 text-lg leading-tight text-terminal-yellow">{item.title}</h3>
                    <p className="mt-1 text-base text-terminal-cyan">{item.publication}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="viewdata-rule mt-7" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <StorySoFarPanel />
      </section>
    </main>
  );
}
