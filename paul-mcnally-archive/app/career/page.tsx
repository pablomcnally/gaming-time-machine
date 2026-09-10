import type { Metadata } from "next";
import Link from "next/link";
import { CareerTimeline } from "../../components/CareerTimeline";
import { PageContainer } from "../../components/PageContainer";
import { careerEntries } from "../../data/career";
import { pageLabels } from "../../data/site";

export const metadata: Metadata = {
  title: "Career",
  description: "A Viewdata-inspired career timeline for Paul McNally."
};

export default function CareerPage() {
  return (
    <PageContainer
      eyebrow={pageLabels.career.eyebrow}
      title={pageLabels.career.title}
      intro={pageLabels.career.intro}
    >
      <CareerTimeline entries={careerEntries} />
      <section className="mt-10 border border-terminal-cyan/60 bg-terminal-black/80 p-5 shadow-terminal md:p-8">
        <p className="font-mono text-sm uppercase text-terminal-green">Micronet Radio // Episode 103</p>
        <h2 className="mt-3 font-mono text-2xl uppercase text-terminal-yellow md:text-4xl">Hear the story behind the timeline</h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-terminal-paper">
          In this two-hour Maximum Power Up interview, Paul talks through the magazines, launches, trips and people that shaped his career in games journalism.
        </p>
        <Link className="mt-6 inline-flex border border-terminal-yellow px-4 py-3 font-mono text-sm uppercase text-terminal-yellow transition hover:bg-terminal-yellow hover:text-terminal-black" href="/features/maximum-power-up-paul-mcnally-interview">
          Listen to the 2020 interview
        </Link>
      </section>
    </PageContainer>
  );
}
