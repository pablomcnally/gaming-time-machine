import { redirect } from "next/navigation";
import { MagazineCoverGallery, type MagazineCoverItem } from "./components/magazine-cover-gallery";
import { MuseumFooter } from "./components/museum-footer";
import { YearTimeline } from "./components/year-timeline";
import {
  DEFAULT_YEAR,
  exhibitStatusLabels,
  getArchiveSelection,
  getArchiveStats,
  getFeaturedExhibits,
  getLatestExhibitHref,
  getRandomExhibitHref,
  type ExhibitStatus
} from "../data/archive";

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

type ArtifactImageItem = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  kind?: string;
};

function getString(item: Item, key: string) {
  return typeof item[key] === "string" ? item[key] : undefined;
}

function getStringList(item: Item, key: string) {
  return Array.isArray(item[key])
    ? (item[key] as unknown[]).filter((value): value is string => typeof value === "string")
    : [];
}

function normalizeArtifactImageSrc(src: string) {
  if (src.startsWith("/artifacts/")) {
    return src;
  }

  if (src.startsWith("artifacts/")) {
    return `/${src}`;
  }

  if (src.startsWith("/")) {
    return undefined;
  }

  return `/artifacts/${src}`;
}

function getArtifactImageFromValue(value: unknown, fallbackId: string, fallbackAlt: string): ArtifactImageItem | null {
  if (typeof value === "string") {
    const src = normalizeArtifactImageSrc(value);

    return src
      ? {
          id: `${fallbackId}-image`,
          src,
          alt: fallbackAlt
        }
      : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const image = value as Record<string, unknown>;
  const rawSrc =
    typeof image.src === "string"
      ? image.src
      : typeof image.image === "string"
        ? image.image
        : typeof image.artifactImage === "string"
          ? image.artifactImage
          : undefined;

  if (!rawSrc) {
    return null;
  }

  const src = normalizeArtifactImageSrc(rawSrc);

  if (!src) {
    return null;
  }

  const caption = typeof image.caption === "string" ? image.caption : undefined;
  const credit = typeof image.credit === "string" ? image.credit : undefined;
  const kind = typeof image.kind === "string" ? image.kind : typeof image.type === "string" ? image.type : undefined;
  const alt =
    typeof image.alt === "string"
      ? image.alt
      : typeof image.artifactImageAlt === "string"
        ? image.artifactImageAlt
        : caption ?? fallbackAlt;

  return {
    id: typeof image.id === "string" ? image.id : `${fallbackId}-${src}`,
    src,
    alt,
    caption,
    credit,
    kind
  };
}

function getArtifactImages(item: Item): ArtifactImageItem[] {
  const fallbackAlt = `${item.title} artifact image.`;
  const images: ArtifactImageItem[] = [];
  const multiImageValue = item.artifactImages ?? item.images;

  if (Array.isArray(multiImageValue)) {
    multiImageValue.forEach((value, index) => {
      const image = getArtifactImageFromValue(value, `${item.title}-${index}`, fallbackAlt);

      if (image) {
        images.push(image);
      }
    });
  }

  const singleImageSrc =
    getString(item, "artifactImage") ?? getString(item, "artifactImageSrc") ?? getString(item, "image") ?? getString(item, "imageSrc");

  if (singleImageSrc) {
    const image = getArtifactImageFromValue(
      {
        src: singleImageSrc,
        alt: getString(item, "artifactImageAlt") ?? getString(item, "imageAlt"),
        caption: getString(item, "artifactImageCaption") ?? getString(item, "imageCaption"),
        credit: getString(item, "artifactImageCredit") ?? getString(item, "imageCredit"),
        kind: getString(item, "artifactImageType") ?? getString(item, "imageType")
      },
      `${item.title}-primary`,
      fallbackAlt
    );

    if (image && !images.some((existingImage) => existingImage.src === image.src)) {
      images.push(image);
    }
  }

  return images;
}

function ArtifactImageGallery({ images }: { images: ArtifactImageItem[] }) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`mt-5 grid gap-4 md:mt-6 ${images.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {images.map((image) => (
        <figure key={image.id} className="overflow-hidden border border-black/10 bg-[#f3efe4]">
          <div className="relative aspect-[4/3] bg-zinc-950">
            <img src={image.src} alt={image.alt} className="h-full w-full object-cover" loading="lazy" />
            {image.kind ? (
              <span className="absolute left-3 top-3 bg-zinc-950/85 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-100">
                {image.kind}
              </span>
            ) : null}
          </div>
          {image.caption || image.credit ? (
            <figcaption className="border-t border-black/10 px-4 py-3">
              {image.caption ? <p className="text-sm leading-6 text-zinc-700">{image.caption}</p> : null}
              {image.credit ? (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{image.credit}</p>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
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
    <section id={section.id} className="scroll-mt-24 border-t border-black/10 py-12 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-7 px-5 md:grid-cols-[0.85fr_2fr] md:gap-10 md:px-8">
        <div className="md:sticky md:top-24 md:self-start">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-red-700 md:text-xs md:tracking-[0.32em]">{section.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl leading-none text-zinc-950 sm:text-4xl md:mt-4 md:text-6xl">{section.title}</h2>
          <p className="mt-4 max-w-sm text-base leading-7 text-zinc-600 md:mt-5">{section.subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function NewsCard({ item, index }: { item: Item; index: number }) {
  return (
    <article className="group relative border border-black/10 bg-[#fbf8ef] p-5 shadow-exhibit transition duration-300 hover:-translate-y-1 md:p-6">
      <div className="absolute right-4 top-4 font-mono text-xs text-zinc-400">0{index + 1}</div>
      <p className="pr-10 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 md:text-xs md:tracking-[0.22em]">{getString(item, "date")}</p>
      <h3 className="mt-4 max-w-lg font-display text-2xl leading-none text-zinc-950 sm:text-3xl md:mt-5">{item.title}</h3>
      <p className="mt-4 text-base leading-7 text-zinc-600 md:mt-5">{item.body}</p>
      <ArtifactImageGallery images={getArtifactImages(item)} />
      {getString(item, "artifact") ? (
        <p className="mt-6 inline-flex border border-zinc-950 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-950 md:mt-8 md:text-[11px] md:tracking-[0.2em]">
          {getString(item, "artifact")}
        </p>
      ) : null}
    </article>
  );
}

function ReleaseCard({ item }: { item: Item }) {
  return (
    <article className="grid border border-black/10 bg-white md:grid-cols-[9rem_1fr]">
      <div className="flex items-center justify-between gap-4 bg-zinc-950 p-4 text-stone-50 md:min-h-32 md:flex-col md:items-start md:p-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200 md:text-xs md:tracking-[0.24em]">{getString(item, "date")}</span>
        <span className="text-right text-[11px] uppercase tracking-[0.16em] text-zinc-400 md:text-left md:text-xs md:tracking-[0.18em]">{getString(item, "platform")}</span>
      </div>
      <div className="p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-red-700 md:text-xs md:tracking-[0.24em]">{getString(item, "signal")}</p>
        <h3 className="mt-3 font-display text-2xl leading-none text-zinc-950 sm:text-3xl">{item.title}</h3>
        <p className="mt-3 leading-7 text-zinc-600">{item.body}</p>
        <ArtifactImageGallery images={getArtifactImages(item)} />
      </div>
    </article>
  );
}

function HardwareCard({ item }: { item: Item }) {
  return (
    <article className="border border-zinc-950 bg-[#e7efe7] p-5 md:p-6">
      <div className="h-2 w-24 bg-red-600" />
      <h3 className="mt-5 font-display text-2xl leading-none text-zinc-950 sm:text-3xl md:mt-6">{item.title}</h3>
      <p className="mt-4 leading-7 text-zinc-700">{item.body}</p>
      <ArtifactImageGallery images={getArtifactImages(item)} />
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
    <article className="border-l-4 border-red-700 bg-white/70 p-5 md:p-6">
      <h3 className="font-display text-2xl leading-none text-zinc-950 sm:text-3xl">{item.title}</h3>
      <p className="mt-4 leading-7 text-zinc-600">{item.body}</p>
      <ArtifactImageGallery images={getArtifactImages(item)} />
    </article>
  );
}

function CuratorStatusBadge({ status }: { status: ExhibitStatus }) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="mt-6 inline-flex border border-amber-200/30 bg-zinc-950/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-100">
      Curator Status: {exhibitStatusLabels[status]}
    </div>
  );
}

function UnderConstruction({ monthLabel, year }: { monthLabel?: string; year: number }) {
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
            {monthLabel ? `${monthLabel} has a reserved drawer in the archive.` : "This year has a reserved drawer in the archive."}
          </h3>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            {monthLabel
              ? `No exhibit file is installed for ${monthLabel} yet. The timeline keeps the month visible so the collection feels like a living museum catalog rather than a broken route.`
              : `No exhibit files are installed for ${year} yet. The timeline keeps the year visible so the collection feels like a living museum catalog rather than a broken route.`}
          </p>
          <a
            href={`/${DEFAULT_YEAR}/october`}
            className="mt-8 inline-flex border border-zinc-950 bg-zinc-950 px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-stone-50 transition hover:bg-red-700"
          >
            Return to October 1997
          </a>
        </article>
      </div>
    </section>
  );
}

function HomeLanding({
  randomExhibitHref,
  timelineMonths,
  timelineYears
}: {
  randomExhibitHref: string;
  timelineMonths: Parameters<typeof YearTimeline>[0]["months"];
  timelineYears: Parameters<typeof YearTimeline>[0]["years"];
}) {
  const archiveStats = getArchiveStats();
  const featuredExhibits = getFeaturedExhibits();
  const latestExhibitHref = getLatestExhibitHref();

  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="relative isolate overflow-hidden bg-zinc-950 px-5 py-10 text-stone-50 md:px-8 md:py-20">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_15%,rgba(255,215,128,.28),transparent_30%),radial-gradient(circle_at_70%_40%,rgba(56,189,248,.16),transparent_24%),linear-gradient(135deg,#09090b,#1f2937_45%,#3f1d25)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[size:100%_12px] opacity-25" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="flex items-center justify-between gap-4 sm:gap-6">
            <a href="/" className="group inline-flex" aria-label="Gaming Time Machine home">
              <img
                src="/logo.svg"
                alt="Gaming Time Machine"
                className="h-auto w-[min(68vw,16rem)] transition duration-300 group-hover:opacity-85 sm:w-80"
              />
            </a>
            <a href="/about" className="hidden font-mono text-xs uppercase tracking-[0.24em] text-amber-200 transition hover:text-amber-100 sm:inline">
              About the archive
            </a>
          </nav>

          <div className="grid gap-8 pb-3 pt-12 md:grid-cols-[1.1fr_0.9fr] md:items-end md:gap-10 md:pb-6 md:pt-24">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-red-300 md:text-xs md:tracking-[0.34em]">Entrance hall</p>
              <h1 className="mt-5 max-w-4xl font-display text-5xl leading-none sm:text-6xl md:mt-6 md:text-8xl">
                <span className="block">Gaming</span>
                <span className="mt-1 block text-[0.88em] text-amber-100 md:mt-2">Time Machine</span>
              </h1>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-100/85 sm:text-sm sm:tracking-[0.28em] md:mt-6">
                Gaming History, One Month at a Time.
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200 md:mt-8 md:text-xl md:leading-9">
                A digital museum of video game history, built to explore the atmosphere around each month: the machines people wanted, the magazines they read, the games they saved up for, and the rumours that moved through shops, arcades, playgrounds and early online spaces.
              </p>
              <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap md:mt-9">
                <a href="#timeline-archive" className="border border-amber-200 bg-amber-200 px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-stone-50">
                  Explore the Timeline
                </a>
                <a href={randomExhibitHref} className="border border-stone-100/30 px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.18em] text-stone-50 transition hover:border-amber-200 hover:text-amber-100">
                  Take Me Somewhere Random
                </a>
                <a href={latestExhibitHref} className="border border-stone-100/30 px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.18em] text-stone-50 transition hover:border-amber-200 hover:text-amber-100">
                  Latest Added Exhibit
                </a>
              </div>
            </div>
            <div className="grid gap-5 md:self-end">
              <figure className="overflow-hidden border border-stone-100/20 bg-stone-50/10 p-2 shadow-exhibit backdrop-blur">
                <img
                  src="/entrance-portal.png"
                  alt="Two players leaping into the glowing Gaming Time Machine archive entrance."
                  className="aspect-[4/3] w-full object-cover"
                />
              </figure>
              <aside className="border border-stone-100/20 bg-stone-50/10 p-5 backdrop-blur md:p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber-200 md:text-xs md:tracking-[0.28em]">Curator note</p>
                <p className="mt-4 text-base leading-7 text-stone-100 md:mt-5 md:text-lg md:leading-8">
                  Gaming Time Machine is a living archive exploring not just games and hardware, but what it felt like to be a player at different moments in history.
                </p>
              </aside>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-black/10 bg-[#e7efe7] px-5 py-8 md:px-8" aria-label="Archive statistics">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Years in Archive</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{archiveStats.yearsInArchive}</p>
          </article>
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Monthly Exhibits</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{archiveStats.monthlyExhibits}</p>
          </article>
          <article className="border border-zinc-950/15 bg-[#fbf8ef] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Verified Exhibits</p>
            <p className="mt-3 font-display text-4xl text-zinc-950">{archiveStats.verifiedExhibits}</p>
          </article>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-20" aria-label="Featured exhibits">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-[0.85fr_2fr]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-red-700 md:text-xs md:tracking-[0.32em]">Featured exhibits</p>
              <h2 className="mt-3 font-display text-3xl leading-none text-zinc-950 sm:text-4xl md:mt-4 md:text-6xl">Start with a drawer</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {featuredExhibits.map((record) => (
                <a
                  key={`${record.year}-${record.monthId}`}
                  href={record.href}
                  className="group border border-black/10 bg-[#fbf8ef] p-5 shadow-exhibit transition hover:-translate-y-1 hover:border-red-700 md:p-6"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-red-700 md:text-xs md:tracking-[0.24em]">{record.exhibit.museum.accession}</p>
                  <h3 className="mt-4 font-display text-3xl leading-none text-zinc-950 sm:text-4xl">{record.label}</h3>
                  <p className="mt-4 text-base leading-7 text-zinc-600">{record.exhibit.museum.dek}</p>
                  <span className="mt-6 inline-flex font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition group-hover:text-red-700">
                    Open exhibit
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <YearTimeline months={timelineMonths} selectedYear={DEFAULT_YEAR} years={timelineYears} />

      <MuseumFooter randomExhibitHref={randomExhibitHref} />
    </main>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getMonthId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getYearId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function ExhibitPage({ yearParam, monthParam }: { yearParam?: string; monthParam?: string }) {
  const { selectedYear, currentMonth, timelineMonths, timelineYears } = await getArchiveSelection(
    yearParam,
    monthParam
  );
  const randomExhibitHref = getRandomExhibitHref();

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
  const selectedTimelineMonth = timelineMonths.find((month) => month.isSelected);

  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="relative isolate overflow-hidden bg-zinc-950 text-stone-50">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_15%,rgba(255,215,128,.28),transparent_30%),radial-gradient(circle_at_70%_40%,rgba(56,189,248,.2),transparent_24%),linear-gradient(135deg,#09090b,#1f2937_45%,#3f1d25)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[size:100%_12px] opacity-25" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:gap-6 md:px-8 md:py-5">
          <a
            href="/"
            className="group flex min-w-0 items-center gap-4"
            aria-label="Gaming Time Machine home"
          >
            <img
              src="/logo.svg"
              alt="Gaming Time Machine"
              className="h-auto w-[min(68vw,14rem)] transition duration-300 group-hover:opacity-85 sm:w-64"
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
        <div id="top" className="relative mx-auto grid max-w-7xl gap-7 px-5 pb-12 pt-10 md:grid-cols-[1.2fr_0.8fr] md:gap-10 md:px-8 md:pb-24 md:pt-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-100/80 sm:text-sm sm:tracking-[0.28em]">
              Gaming History, One Month at a Time
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-red-300 md:mt-7 md:text-xs md:tracking-[0.34em]">{museum.accession}</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl leading-none text-stone-50 sm:text-6xl md:mt-5 md:text-8xl">
              {museum.period}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200 md:mt-8 md:text-xl md:leading-9">{museum.dek}</p>
            <div className="mt-6 flex flex-wrap gap-2 md:mt-8 md:gap-3">
              {museum.statusChips.map((chip) => (
                <span key={chip} className="border border-stone-100/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-200 md:text-xs md:tracking-[0.2em]">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <aside className="self-end border border-stone-100/20 bg-stone-50/10 p-5 backdrop-blur md:p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber-200 md:text-xs md:tracking-[0.28em]">Curator note</p>
            <p className="mt-4 text-base leading-7 text-stone-100 md:mt-5 md:text-lg md:leading-8">{museum.curatorNote}</p>
            {exhibit ? <CuratorStatusBadge status={exhibit.status} /> : null}
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
                  <article key={item.title} className="grid gap-2 border-t border-black/10 py-6 md:grid-cols-[5rem_1fr] md:gap-0">
                    <p className="font-display text-3xl text-red-700 md:text-4xl">{String(index + 1).padStart(2, "0")}</p>
                    <div>
                      <h3 className="font-display text-2xl leading-none text-zinc-950 sm:text-3xl">{item.title}</h3>
                      <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600 md:text-lg md:leading-8">{item.body}</p>
                      <ArtifactImageGallery images={getArtifactImages(item)} />
                    </div>
                  </article>
                ))}
              </div>
            </SectionFrame>
          ) : null}
        </>
      ) : (
        <UnderConstruction monthLabel={selectedTimelineMonth ? `${selectedTimelineMonth.label} ${selectedYear}` : undefined} year={selectedYear} />
      )}

      <MuseumFooter randomExhibitHref={randomExhibitHref} sources={sources} />
    </main>
  );
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const yearParam = getYearId(params.year);
  const monthParam = getMonthId(params.month);

  if (yearParam || monthParam) {
    const selection = await getArchiveSelection(yearParam, monthParam);
    const monthPath = monthParam ?? selection.currentMonth?.id ?? "january";

    redirect(`/${selection.selectedYear}/${monthPath}`);
  }

  const { timelineMonths, timelineYears } = await getArchiveSelection();

  return (
    <HomeLanding
      randomExhibitHref={getRandomExhibitHref()}
      timelineMonths={timelineMonths}
      timelineYears={timelineYears}
    />
  );
}
