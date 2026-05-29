import { MagazineCoverGallery, type MagazineCoverItem } from "./components/magazine-cover-gallery";
import { MonthSelector } from "./components/month-selector";
import { YearTimeline } from "./components/year-timeline";
import { DEFAULT_YEAR, getArchiveSelection } from "../data/archive";

type Item = {
  title: string;
  body: string;
  [key: string]: unknown;
};
type Section = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  items: Item[];
};

function getString(item: Item, key: string) {
  return typeof item[key] === "string" ? item[key] : undefined;
}

function getStringList(item: Item, key: string) {
  return Array.isArray(item[key])
    ? (item[key] as unknown[]).filter((value): value is string => typeof value === "string")
    : [];
}

function getMagazineCoverItems(section: Section, fallbackIssueDate: string): MagazineCoverItem[] {
  return section.items
    .map((item) => {
      const coverImage = getString(item, "coverImage");

      if (!coverImage) {
        return null;
      }

      const publicationName = getString(item, "publicationName") ?? item.title;
      const issueDate = getString(item, "issueDate") ?? getString(item, "month") ?? fallbackIssueDate;

      return {
        id: getString(item, "id") ?? `${publicationName}-${issueDate}`,
        publicationName,
        issueDate,
        curatorNote: getString(item, "curatorNote") ?? item.body,
        coverImage,
        coverImageAlt: getString(item, "coverImageAlt") ?? `${publicationName} ${issueDate} cover image.`
      };
    })
    .filter((cover): cover is MagazineCoverItem => Boolean(cover));
}

function SectionFrame({ section, children }: { section: Section; children: React.ReactNode }) {
  return (
    <section id={section.id} className="scroll-mt-24 border-t border-black/10 py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[0.85fr_2fr] md:px-8">
        <div className="md:sticky md:top-24 md:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-red-700">{section.eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl text-zinc-950 md:text-6xl">{section.title}</h2>
          <p className="mt-5 max-w-sm text-base leading-7 text-zinc-600">{section.subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function NewsCard({ item, index }: { item: Item; index: number }) {
  return (
    <article className="group relative border border-black/10 bg-[#fbf8ef] p-6 shadow-exhibit transition duration-300 hover:-translate-y-1">
      <div className="absolute right-4 top-4 font-mono text-xs text-zinc-400">0{index + 1}</div>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">{getString(item, "date")}</p>
      <h3 className="mt-5 max-w-lg font-display text-3xl leading-none text-zinc-950">{item.title}</h3>
      <p className="mt-5 text-base leading-7 text-zinc-600">{item.body}</p>
      {getString(item, "artifact") ? (
        <p className="mt-8 inline-flex border border-zinc-950 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-950">
          {getString(item, "artifact")}
        </p>
      ) : null}
    </article>
  );
}

function ReleaseCard({ item }: { item: Item }) {
  return (
    <article className="grid border border-black/10 bg-white md:grid-cols-[9rem_1fr]">
      <div className="flex min-h-32 flex-col justify-between bg-zinc-950 p-5 text-stone-50">
        <span className="font-mono text-xs uppercase tracking-[0.24em] text-amber-200">{getString(item, "date")}</span>
        <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">{getString(item, "platform")}</span>
      </div>
      <div className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-700">{getString(item, "signal")}</p>
        <h3 className="mt-3 font-display text-3xl text-zinc-950">{item.title}</h3>
        <p className="mt-3 leading-7 text-zinc-600">{item.body}</p>
      </div>
    </article>
  );
}

function HardwareCard({ item }: { item: Item }) {
  return (
    <article className="border border-zinc-950 bg-[#e7efe7] p-6">
      <div className="h-2 w-24 bg-red-600" />
      <h3 className="mt-6 font-display text-3xl text-zinc-950">{item.title}</h3>
      <p className="mt-4 leading-7 text-zinc-700">{item.body}</p>
      <div className="mt-7 flex flex-wrap gap-2">
        {getStringList(item, "specs").map((spec) => (
          <span key={spec} className="border border-zinc-950 bg-[#fbf8ef] px-3 py-2 font-mono text-xs uppercase">
            {spec}
          </span>
        ))}
      </div>
    </article>
  );
}

function PlainArtifact({ item }: { item: Item }) {
  return (
    <article className="border-l-4 border-red-700 bg-white/70 p-6">
      <h3 className="font-display text-3xl text-zinc-950">{item.title}</h3>
      <p className="mt-4 leading-7 text-zinc-600">{item.body}</p>
    </article>
  );
}

function UnderConstruction({ year }: { year: number }) {
  return (
    <section className="border-t border-black/10 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[0.85fr_2fr] md:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-red-700">Archive slot</p>
          <h2 className="mt-4 font-display text-4xl text-zinc-950 md:text-6xl">{year}</h2>
        </div>
        <article className="border border-black/10 bg-[#fbf8ef] p-8 shadow-exhibit md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">Exhibit under construction</p>
          <h3 className="mt-5 max-w-2xl font-display text-4xl leading-none text-zinc-950">
            This year has a reserved drawer in the archive.
          </h3>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            No exhibit files are installed for {year} yet. The timeline keeps the year visible so the collection
            feels like a living museum catalog rather than a broken route.
          </p>
          <a
            href={`/?year=${DEFAULT_YEAR}&month=october`}
            className="mt-8 inline-flex border border-zinc-950 bg-zinc-950 px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-stone-50 transition hover:bg-red-700"
          >
            Return to October 1997
          </a>
        </article>
      </div>
    </section>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getMonthId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getYearId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { selectedYear, currentMonth, months, timelineMonths, timelineYears } = await getArchiveSelection(
    getYearId(params.year),
    getMonthId(params.month)
  );
  const exhibit = currentMonth?.exhibit;
  const museum = exhibit?.museum ?? {
    name: "Gaming Time Machine",
    period: String(selectedYear),
    accession: `GTM-${selectedYear}`,
    dek: "A museum archive for playable history, shelf culture, hardware rituals, and the texture of games in time.",
    curatorNote: "This year is visible in the timeline, but its exhibit case is still being prepared.",
    statusChips: ["archive slot", "pending research", "future exhibit"]
  };
  const sections = exhibit?.sections ?? [];
  const sources = exhibit?.sources ?? [];
  const news = sections.find((section) => section.id === "news");
  const releases = sections.find((section) => section.id === "releases");
  const hardware = sections.find((section) => section.id === "hardware");
  const magazines = sections.find((section) => section.id === "magazines");
  const magazineCovers = magazines ? getMagazineCoverItems(magazines, museum.period) : [];
  const online = sections.find((section) => section.id === "online");
  const felt = sections.find((section) => section.id === "felt");

  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="relative isolate overflow-hidden bg-zinc-950 text-stone-50">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_15%,rgba(255,215,128,.28),transparent_30%),radial-gradient(circle_at_70%_40%,rgba(56,189,248,.2),transparent_24%),linear-gradient(135deg,#09090b,#1f2937_45%,#3f1d25)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[size:100%_12px] opacity-25" />
        <MonthSelector
          currentMonthId={currentMonth?.id ?? ""}
          months={months.map(({ id, label, href }) => ({ id, label, href }))}
          randomHref={`/?year=${DEFAULT_YEAR}&month=october`}
        />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 md:px-8">
          <a
            href="/"
            className="group flex min-w-0 items-center gap-4"
            aria-label="Gaming Time Machine home"
          >
            <img
              src="/logo.svg"
              alt="Gaming Time Machine"
              className="h-auto w-[min(58vw,15rem)] transition duration-300 group-hover:opacity-85 sm:w-64"
            />
            <span className="hidden border-l border-stone-100/20 pl-4 font-mono text-xs uppercase tracking-[0.24em] text-amber-200 lg:inline">
              {museum.accession}
            </span>
          </a>
          <div className="hidden gap-5 text-xs uppercase tracking-[0.18em] text-stone-300 md:flex">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="transition hover:text-white">
                {section.title}
              </a>
            ))}
          </div>
        </nav>
        <div id="top" className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:pb-24 md:pt-20">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.42em] text-red-300">{museum.period}</p>
            <h1 className="mt-6 max-w-4xl">
              <a href="/" aria-label="Gaming Time Machine home" className="inline-block transition duration-300 hover:opacity-90">
                <img
                  src="/logo.svg"
                  alt={museum.name}
                  className="h-auto w-full max-w-[46rem]"
                />
              </a>
            </h1>
            <p className="mt-5 max-w-2xl font-mono text-xs uppercase tracking-[0.28em] text-amber-100/80 sm:text-sm">
              Gaming History, One Month at a Time
            </p>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-stone-200">{museum.dek}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {museum.statusChips.map((chip) => (
                <span key={chip} className="border border-stone-100/30 px-3 py-2 font-mono text-xs uppercase tracking-[0.2em] text-stone-200">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <aside className="self-end border border-stone-100/20 bg-stone-50/10 p-6 backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200">Curator note</p>
            <p className="mt-5 text-lg leading-8 text-stone-100">{museum.curatorNote}</p>
          </aside>
        </div>
      </header>

      <YearTimeline months={timelineMonths} selectedYear={selectedYear} years={timelineYears} />

      {exhibit ? (
        <>
          {news ? (
            <SectionFrame section={news}>
              <div className="grid gap-5 lg:grid-cols-2">
                {news.items.map((item, index) => (
                  <NewsCard key={item.title} item={item} index={index} />
                ))}
              </div>
            </SectionFrame>
          ) : null}

          {releases ? (
            <SectionFrame section={releases}>
              <div className="grid gap-4">
                {releases.items.map((item) => (
                  <ReleaseCard key={item.title} item={item} />
                ))}
              </div>
            </SectionFrame>
          ) : null}

          {hardware ? (
            <SectionFrame section={hardware}>
              <div className="grid gap-5 lg:grid-cols-3">
                {hardware.items.map((item) => (
                  <HardwareCard key={item.title} item={item} />
                ))}
              </div>
            </SectionFrame>
          ) : null}

          {magazines ? (
            <SectionFrame section={magazines}>
              <MagazineCoverGallery covers={magazineCovers} />
            </SectionFrame>
          ) : null}

          {online ? (
            <SectionFrame section={online}>
              <div className="grid gap-5 md:grid-cols-2">
                {online.items.map((item) => (
                  <PlainArtifact key={item.title} item={item} />
                ))}
              </div>
            </SectionFrame>
          ) : null}

          {felt ? (
            <SectionFrame section={felt}>
              <div className="grid gap-4">
                {felt.items.map((item, index) => (
                  <article key={item.title} className="grid border-t border-black/10 py-6 md:grid-cols-[5rem_1fr]">
                    <p className="font-display text-4xl text-red-700">{String(index + 1).padStart(2, "0")}</p>
                    <div>
                      <h3 className="font-display text-3xl text-zinc-950">{item.title}</h3>
                      <p className="mt-3 max-w-3xl text-lg leading-8 text-zinc-600">{item.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </SectionFrame>
          ) : null}
        </>
      ) : (
        <UnderConstruction year={selectedYear} />
      )}

      <footer className="border-t border-black/10 bg-zinc-950 px-5 py-12 text-stone-200 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.8fr_2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200">Source shelf</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">
              Exhibit notes are condensed from contemporary release listings, magazine records, and platform context.
            </p>
          </div>
          {sources.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  className="border border-stone-100/15 p-4 text-sm leading-6 text-stone-300 transition hover:border-amber-200 hover:text-white"
                >
                  {source.label}
                </a>
              ))}
            </div>
          ) : (
            <div className="border border-stone-100/15 p-4 text-sm leading-6 text-stone-300">
              Source links will appear when this year receives its first exhibit file.
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
