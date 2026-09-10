import type { Metadata } from "next";
import Link from "next/link";
import { CareerMilestones } from "../../components/CareerMilestones";
import { PageContainer } from "../../components/PageContainer";
import { TerminalPanel } from "../../components/TerminalPanel";
import { aboutContent } from "../../data/pages";

export const metadata: Metadata = {
  title: "About",
  description: "Biography and background for Paul McNally, games journalist, editor, writer and retro enthusiast."
};

const panelImages: Record<string, { src: string; alt: string }> = {
  "MAGAZINE HISTORY": {
    src: "/portfolio/about/retro-magazines-pablonet.png",
    alt: "Pixel-art covers inspired by Amiga Action, PlayStation Pro and ST Action magazines"
  },
  "BEYOND THE GAMES INDUSTRY": {
    src: "/portfolio/about/sport-pablonet.png",
    alt: "Pixel-art scene of a rugby interview at a packed stadium"
  }
};

export default function AboutPage() {
  return (
    <PageContainer
      eyebrow={aboutContent.eyebrow}
      title={aboutContent.title}
      intro={aboutContent.intro}
    >
      <figure className="mb-8 overflow-hidden border border-terminal-cyan/40 bg-terminal-black md:mb-10">
        <img
          src="/portfolio/about/nerdcon-pablonet.png"
          alt="Pixel-art scene of Paul McNally speaking during an onstage interview at NerdCon"
          className="aspect-[3/1] w-full object-cover"
        />
      </figure>
      <section className="mb-8 border border-terminal-cyan/60 bg-terminal-black/80 p-5 shadow-terminal md:mb-10 md:p-8">
        <p className="font-mono text-sm uppercase text-terminal-green">Micronet Radio // Episode 103</p>
        <h2 className="mt-3 font-mono text-2xl uppercase text-terminal-yellow md:text-4xl">Hear the story behind the timeline</h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-terminal-paper">
          In this two-hour Maximum Power Up interview, Paul talks through the magazines, launches, trips and people that shaped his career in games journalism.
        </p>
        <Link className="mt-6 inline-flex border border-terminal-yellow px-4 py-3 font-mono text-sm uppercase text-terminal-yellow transition hover:bg-terminal-yellow hover:text-terminal-black" href="/features/maximum-power-up-paul-mcnally-interview">
          Listen to the 2020 interview
        </Link>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {aboutContent.panels.map((panel) => {
          const isPublicationList = panel.title === "SELECTED PUBLICATIONS";
          const panelImage = panelImages[panel.title];

          return (
            <div key={panel.title} className={isPublicationList ? "lg:col-span-2" : undefined}>
              <TerminalPanel title={panel.title} tone={panel.tone}>
                {isPublicationList ? (
                  <ul className="grid gap-x-8 gap-y-3 font-mono text-base sm:grid-cols-2 lg:grid-cols-3" aria-label="Selected publications">
                    {panel.paragraphs.map((publication) => (
                      <li key={publication} className="flex min-w-0 items-start gap-3">
                        <span className="text-terminal-green" aria-hidden="true">&gt;</span>
                        <span className="min-w-0 break-words">{publication}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    {panelImage ? (
                      <figure className="mb-5 overflow-hidden border border-terminal-green/50 bg-terminal-black">
                        <img
                          src={panelImage.src}
                          alt={panelImage.alt}
                          className="aspect-video w-full object-cover"
                        />
                      </figure>
                    ) : null}
                    {panel.paragraphs.map((paragraph, index) => (
                      <p key={`${panel.title}-${index}`} className={`${index > 0 ? "mt-5 " : ""}text-lg leading-8`}>
                        {paragraph}
                      </p>
                    ))}
                  </>
                )}
              </TerminalPanel>
            </div>
          );
        })}
      </div>
      <CareerMilestones />
    </PageContainer>
  );
}
