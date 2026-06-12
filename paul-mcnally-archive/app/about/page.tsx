import type { Metadata } from "next";
import { PageContainer } from "../../components/PageContainer";
import { TerminalPanel } from "../../components/TerminalPanel";

export const metadata: Metadata = {
  title: "About",
  description: "Biography and background for Paul McNally, games journalist, editor, writer and retro enthusiast."
};

export default function AboutPage() {
  return (
    <PageContainer
      eyebrow="Service page 200"
      title="About Paul McNally"
      intro="A working biography for a journalist who came through magazines, moved through digital publishing, and still thinks old machines have useful things to teach new media."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TerminalPanel title="BIOGRAPHY" tone="yellow">
          <p className="text-lg leading-8">
            Paul McNally is a games journalist, editor and writer with a career that runs through print magazines,
            websites, guides, podcasts, events and publishing. He has written about games for long enough to remember
            when screenshots arrived in the post and when a review copy could involve more bubble wrap than bandwidth.
          </p>
          <p className="mt-5 text-lg leading-8">
            The useful part of that history is perspective. Games culture has changed repeatedly, but readers still need
            clear writing, honest judgement and someone willing to separate the genuinely interesting from the very loud.
          </p>
        </TerminalPanel>
        <TerminalPanel title="EDITORIAL WORK" tone="cyan">
          <p className="text-lg leading-8">
            Editing is partly taste, partly logistics, and partly knowing when a sentence is trying to sneak past you.
            Paul has worked across news, reviews, features, guides, commerce and publishing operations, with the
            practical experience that comes from getting work shipped rather than merely discussed.
          </p>
          <p className="mt-5 text-lg leading-8">
            That includes commissioning, rewriting, production planning, traffic-aware editorial work, and helping writers
            keep their own voice while still serving the reader.
          </p>
        </TerminalPanel>
        <TerminalPanel title="MAGAZINE HISTORY" tone="green">
          <p className="text-lg leading-8">
            Magazine work teaches useful habits: make the point, respect the space, meet the deadline, and never assume
            the reader has seen the same demo you have. Those habits still matter online, even if the page furniture has
            changed.
          </p>
        </TerminalPanel>
        <TerminalPanel title="RETRO COMPUTING" tone="red">
          <p className="text-lg leading-8">
            The retro interest is not just nostalgia. Old systems explain why modern interfaces feel the way they do, and
            why some apparently obsolete ideas still work. Micronet, Prestel, Teletext and early BBS culture all treated
            navigation as part of the experience. This site borrows that idea without asking anyone to wait for a modem.
          </p>
        </TerminalPanel>
        <TerminalPanel title="CURRENT PROJECTS" tone="yellow">
          <p className="text-lg leading-8">
            Current work spans games journalism, editorial projects, retro archive material, and writing about the places
            where games, technology and media history overlap. More detail can be added here as the archive fills out.
          </p>
        </TerminalPanel>
      </div>
    </PageContainer>
  );
}
