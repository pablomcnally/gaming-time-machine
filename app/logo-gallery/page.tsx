import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logo Gallery | Gaming Time Machine",
  description: "Curator-only logo concept gallery for Gaming Time Machine.",
  robots: {
    index: false,
    follow: false
  }
};

const concepts = [
  {
    id: "archive-tab",
    name: "Archive Tab",
    note: "A catalogue drawer label with a quiet timeline notch.",
    accent: "Catalogue system / archive label",
    mark: <ArchiveTabMark />
  },
  {
    id: "accession-plaque",
    name: "Accession Plaque",
    note: "A museum object label with accession numbering built into the brand.",
    accent: "Exhibit plaque / accession number",
    mark: <AccessionPlaqueMark />
  },
  {
    id: "timeline-marker",
    name: "Timeline Marker",
    note: "A restrained historical navigation symbol, closer to a map pin than a game logo.",
    accent: "Timeline marker / route through time",
    mark: <TimelineMarkerMark />
  },
  {
    id: "crt-case",
    name: "CRT Case",
    note: "A minimal screen silhouette treated as a museum display case, not retro decoration.",
    accent: "CRT silhouette / display case",
    mark: <CrtCaseMark />
  },
  {
    id: "catalogue-spine",
    name: "Catalogue Spine",
    note: "A book-spine and index-card identity for a serious historical collection.",
    accent: "Historical cataloguing / archive shelf",
    mark: <CatalogueSpineMark />
  },
  {
    id: "chronology-seal",
    name: "Chronology Seal",
    note: "A premium editorial seal with orbiting dates and a central accession point.",
    accent: "Chronometer detail / museum seal",
    mark: <ChronologySealMark />
  }
];

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="leading-none">
      <p className={compact ? "font-display text-2xl uppercase tracking-[0.12em]" : "font-display text-4xl uppercase tracking-[0.1em]"}>
        Gaming
      </p>
      <p className={compact ? "mt-1 font-display text-xl uppercase tracking-[0.1em]" : "mt-2 font-display text-3xl uppercase tracking-[0.08em]"}>
        Time Machine
      </p>
    </div>
  );
}

function ArchiveTabMark() {
  return (
    <div className="relative border border-amber-200/50 bg-[#141414] p-5 text-stone-50">
      <div className="absolute right-0 top-0 h-8 w-20 border-b border-l border-amber-200/40 bg-[#211f1b]" />
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 76 76" className="h-16 w-16 text-amber-200" aria-hidden="true">
          <rect x="13" y="13" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M21 38h34M38 21v34" stroke="currentColor" strokeWidth="2" />
          <circle cx="38" cy="38" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M11 62h54" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div>
          <Wordmark compact />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/80">Archive 1975-2026</p>
        </div>
      </div>
    </div>
  );
}

function AccessionPlaqueMark() {
  return (
    <div className="border border-zinc-950 bg-[#f6f0df] p-5 text-zinc-950 shadow-exhibit">
      <div className="grid gap-4 border border-zinc-950/30 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-700">GTM-0001</p>
          <Wordmark />
        </div>
        <svg viewBox="0 0 80 80" className="h-16 w-16 text-red-700" aria-hidden="true">
          <path d="M40 8v64M8 40h64" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20h40v40H20z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="40" cy="40" r="5" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

function TimelineMarkerMark() {
  return (
    <div className="bg-zinc-950 p-6 text-stone-50">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 108 72" className="h-16 w-24 text-amber-200" aria-hidden="true">
          <path d="M6 36h96" stroke="currentColor" strokeWidth="2" />
          <path d="M28 18l18 18-18 18-18-18z" fill="#b91c1c" stroke="currentColor" strokeWidth="1.5" />
          <path d="M70 28l8 8-8 8-8-8z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="46" cy="36" r="4" fill="currentColor" />
        </svg>
        <div>
          <Wordmark compact />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.26em] text-stone-400">One month at a time</p>
        </div>
      </div>
    </div>
  );
}

function CrtCaseMark() {
  return (
    <div className="border border-stone-100/15 bg-[#191919] p-5 text-stone-50">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 90 72" className="h-16 w-20 text-amber-200" aria-hidden="true">
          <path d="M17 12h56l6 8v32l-6 8H17l-6-8V20z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M25 24h40v22H25z" fill="none" stroke="#f8f0d0" strokeWidth="1.5" />
          <path d="M31 60h28M39 60v6M51 60v6" stroke="currentColor" strokeWidth="2" />
          <circle cx="69" cy="53" r="2.5" fill="#b91c1c" />
        </svg>
        <div>
          <Wordmark compact />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.26em] text-amber-200/80">Displayed history</p>
        </div>
      </div>
    </div>
  );
}

function CatalogueSpineMark() {
  return (
    <div className="grid grid-cols-[4rem_1fr] border border-zinc-950 bg-[#fbf8ef] text-zinc-950 shadow-exhibit">
      <div className="grid place-items-center border-r border-zinc-950 bg-red-800 text-stone-50">
        <p className="-rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.28em]">GTM Archive</p>
      </div>
      <div className="p-5">
        <Wordmark />
        <div className="mt-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          <span>1975</span>
          <span className="h-px flex-1 bg-zinc-950/30" />
          <span>2026</span>
        </div>
      </div>
    </div>
  );
}

function ChronologySealMark() {
  return (
    <div className="border border-amber-200/25 bg-zinc-950 p-5 text-stone-50">
      <div className="grid gap-5 sm:grid-cols-[6rem_1fr] sm:items-center">
        <svg viewBox="0 0 100 100" className="h-24 w-24 text-amber-200" aria-hidden="true">
          <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="#f8f0d0" strokeWidth="1.5" />
          <path d="M50 10v16M50 74v16M10 50h16M74 50h16" stroke="currentColor" strokeWidth="1.5" />
          <path d="M35 50h30" stroke="#b91c1c" strokeWidth="3" />
          <circle cx="50" cy="50" r="4" fill="currentColor" />
        </svg>
        <div>
          <Wordmark compact />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.26em] text-stone-400">Historical index</p>
        </div>
      </div>
    </div>
  );
}

export default function LogoGalleryPage() {
  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="relative isolate overflow-hidden bg-zinc-950 px-5 py-12 text-stone-50 md:px-8 md:py-16">
        <div className="absolute inset-0 opacity-35 [background:radial-gradient(circle_at_25%_15%,rgba(255,215,128,.24),transparent_28%),linear-gradient(135deg,#09090b,#1f2937_48%,#3f1d25)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:100%_12px] opacity-20" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="flex items-center justify-between gap-6">
            <a href="/archive-status" className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200 transition hover:text-amber-100">
              Curator tools
            </a>
            <a href="/" className="hidden font-mono text-xs uppercase tracking-[0.24em] text-stone-300 transition hover:text-amber-100 sm:inline">
              Return to archive
            </a>
          </nav>
          <div className="mt-14 max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-red-300">Identity study</p>
            <h1 className="mt-5 font-display text-5xl leading-none md:text-7xl">Logo Gallery</h1>
            <p className="mt-6 text-lg leading-8 text-stone-300">
              Six alternate logo directions for Gaming Time Machine, exploring museum plaques, catalogue systems,
              timeline markers and historical display language without slipping into generic retro gaming cues.
            </p>
          </div>
        </div>
      </header>

      <section className="px-5 py-10 md:px-8 md:py-14" aria-label="Logo concepts">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {concepts.map((concept, index) => (
            <article key={concept.id} className="grid gap-5 border border-black/10 bg-[#fbf8ef] p-5 shadow-exhibit">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-red-700">
                    Concept {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-zinc-950">{concept.name}</h2>
                </div>
                <span className="border border-zinc-950/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Study
                </span>
              </div>

              <div className="grid min-h-44 place-items-center border border-zinc-950/10 bg-[#e7efe7] p-4">
                <div className="w-full">{concept.mark}</div>
              </div>

              <div className="border-t border-black/10 pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{concept.accent}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{concept.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
