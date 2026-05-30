import type { Metadata } from "next";
import { MuseumFooter } from "../components/museum-footer";
import { getRandomExhibitHref } from "../../data/archive";

export const metadata: Metadata = {
  title: "About Gaming Time Machine",
  description:
    "Gaming Time Machine is a digital museum of video game history, exploring what it felt like to be a player at different moments in time."
};

const sections = [
  {
    title: "Why it exists",
    body: "Gaming history is often remembered through big releases and famous machines, but the texture around those moments matters too. Gaming Time Machine is about the shelves, the shop windows, the magazine covers, the loading screens, the demo discs, the cassette tapes, the cartridges and the small cultural details that made each era feel alive."
  },
  {
    title: "How exhibits work",
    body: "Each exhibit focuses on a single month. Some entries cover confirmed releases and hardware milestones. Others are period context: the games still being talked about, the machines gaining momentum, and the culture surrounding them. Where dates are uncertain, the site avoids false precision and marks context clearly."
  },
  {
    title: "A UK perspective",
    body: "The archive has a strong UK perspective because British gaming history has its own texture: home micros, budget tapes, high-street computer shops, magazine cover tapes, bedroom coders, seaside arcades and playground rumours."
  },
  {
    title: "Curated by",
    body: "Gaming Time Machine is built and curated by Paul McNally, a games journalist and editor."
  },
  {
    title: "Ongoing archive",
    body: "This is a living project. Exhibits will be expanded, corrected and polished over time."
  }
];

export default function AboutPage() {
  const randomExhibitHref = getRandomExhibitHref();

  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="relative isolate overflow-hidden bg-zinc-950 px-5 py-12 text-stone-50 md:px-8 md:py-16">
        <div className="absolute inset-0 opacity-35 [background:radial-gradient(circle_at_25%_15%,rgba(255,215,128,.24),transparent_28%),linear-gradient(135deg,#09090b,#1f2937_48%,#3f1d25)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:100%_12px] opacity-20" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="flex items-center justify-between gap-6">
            <a href="/" className="group inline-flex" aria-label="Gaming Time Machine home">
              <img
                src="/logo.svg"
                alt="Gaming Time Machine"
                className="h-auto w-[min(62vw,16rem)] transition duration-300 group-hover:opacity-85 sm:w-72"
              />
            </a>
            <a href="/" className="hidden font-mono text-xs uppercase tracking-[0.24em] text-amber-200 transition hover:text-amber-100 sm:inline">
              Return to archive
            </a>
          </nav>

          <div className="mt-16 grid gap-10 md:grid-cols-[0.95fr_1.35fr] md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-red-300">Museum introduction</p>
              <h1 className="mt-5 max-w-3xl font-display text-5xl leading-none md:text-7xl">
                About Gaming Time Machine
              </h1>
            </div>
            <div className="border border-stone-100/20 bg-stone-50/10 p-6 backdrop-blur">
              <p className="text-xl leading-9 text-stone-100">
                Gaming Time Machine is a digital museum of video game history, built to explore what it felt like to be
                a player at different moments in time.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-black/10 bg-[#e7efe7] px-5 py-10 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="max-w-4xl text-xl leading-9 text-zinc-700">
            Rather than trying to document every game ever released, it looks at the atmosphere around each month: the
            machines people wanted, the magazines they read, the games they saved up for, the adverts they stared at,
            and the rumours that travelled through playgrounds, arcades, shops and early online spaces.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20" aria-label="About sections">
        <div className="mx-auto grid max-w-7xl gap-7">
          {sections.map((section, index) => (
            <article key={section.title} className="grid gap-5 border-t border-black/10 py-8 md:grid-cols-[12rem_1fr]">
              <div>
                <p className="font-display text-4xl text-red-700">{String(index + 1).padStart(2, "0")}</p>
              </div>
              <div className="max-w-3xl">
                <h2 className="font-display text-4xl leading-none text-zinc-950">{section.title}</h2>
                <p className="mt-5 text-lg leading-8 text-zinc-600">{section.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MuseumFooter randomExhibitHref={randomExhibitHref} />
    </main>
  );
}
