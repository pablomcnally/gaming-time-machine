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
        {aboutContent.panels.map((panel) => {
          const isPublicationList = panel.title === "SELECTED PUBLICATIONS";

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
                  panel.paragraphs.map((paragraph, index) => (
                    <p key={`${panel.title}-${index}`} className={`${index > 0 ? "mt-5 " : ""}text-lg leading-8`}>
                      {paragraph}
                    </p>
                  ))
                )}
              </TerminalPanel>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
