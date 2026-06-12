import Link from "next/link";
import { StorySoFarPanel } from "../components/StorySoFarPanel";
import { archiveItems } from "../data/archive";
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
            <img src="/paul-mcnally-masthead.svg" alt="Paul McNally" />
          </h1>
          <p className="mt-4 text-center text-xl text-terminal-green md:text-2xl">
            Games journalist <span className="text-terminal-yellow">&raquo;</span> Editor{" "}
            <span className="text-terminal-yellow">&raquo;</span> Writer <span className="text-terminal-yellow">&raquo;</span>{" "}
            Retro enthusiast
          </p>

          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center text-lg text-terminal-blue md:text-xl">
            <div className="white-rule" />
            <p>Welcome to my personal archive</p>
            <div className="white-rule" />
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="text-xl leading-8 text-terminal-paper md:text-2xl md:leading-10">
              <p>Three decades of writing about video games.</p>
              <p>From glossy magazine pages to websites, podcasts,</p>
              <p>and everything in between.</p>
              <p>This is a collection of my work, history,</p>
              <p>thoughts and the odd rant.</p>
              <Link className="mt-7 inline-flex text-terminal-green hover:text-terminal-yellow" href="/about">
                &gt; Read more about me <span className="ml-3 text-terminal-paper">[2]</span>
              </Link>
            </div>

            <section className="border border-dashed border-terminal-paper/80 p-4 text-lg leading-8 md:text-xl">
              <div className="mb-4 flex justify-between gap-4 text-terminal-green">
                <h2>Connect status</h2>
                <p>Online</p>
              </div>
              <dl className="grid gap-1">
                <div className="grid grid-cols-[9.5rem_1fr]">
                  <dt className="text-terminal-paper">User:</dt>
                  <dd className="text-terminal-cyan">Paul_McNally</dd>
                </div>
                <div className="grid grid-cols-[9.5rem_1fr]">
                  <dt className="text-terminal-paper">Location:</dt>
                  <dd className="text-terminal-cyan">London, UK</dd>
                </div>
                <div className="grid grid-cols-[9.5rem_1fr]">
                  <dt className="text-terminal-paper">Service:</dt>
                  <dd className="text-terminal-cyan">Personal Archive</dd>
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
                <h2>&lt; Latest posts</h2>
                <p>(1/3) &gt;</p>
              </div>
              <div className="space-y-3 p-4 text-lg text-terminal-paper md:text-xl">
                {musings.map((musing) => (
                  <Link key={musing.id} className="dotted-leader hover:text-terminal-yellow" href={musing.href || "/writing"}>
                    <span>{musing.title}</span>
                    <span className="dotted-leader-date">{formatShortDate(musing.date)}</span>
                  </Link>
                ))}
                <Link className="inline-flex pt-2 text-terminal-green hover:text-terminal-yellow" href="/writing">
                  &gt; View all posts [4]
                </Link>
              </div>
            </section>

            <section className="viewdata-box">
              <div className="viewdata-box-title flex items-center justify-between px-4 py-2 text-xl">
                <h2>Selected work</h2>
                <p>(1/3) &gt;</p>
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
