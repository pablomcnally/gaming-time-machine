import type { Metadata } from "next";
import { PageContainer } from "../../components/PageContainer";
import { TerminalPanel } from "../../components/TerminalPanel";
import { aboutContent } from "../../data/pages";

export const metadata: Metadata = {
  title: "About",
  description: "Biography and background for Paul McNally, games journalist, editor, writer and retro enthusiast."
};

export default function AboutPage() {
  return (
    <PageContainer
      eyebrow={aboutContent.eyebrow}
      title={aboutContent.title}
      intro={aboutContent.intro}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {aboutContent.panels.map((panel) => (
          <TerminalPanel key={panel.title} title={panel.title} tone={panel.tone}>
            {panel.paragraphs.map((paragraph, index) => (
              <p key={`${panel.title}-${index}`} className={`${index > 0 ? "mt-5 " : ""}text-lg leading-8`}>
                {paragraph}
              </p>
            ))}
          </TerminalPanel>
        ))}
      </div>
    </PageContainer>
  );
}
