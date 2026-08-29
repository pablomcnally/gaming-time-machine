import type { Metadata } from "next";
import { PageContainer } from "../../components/PageContainer";
import { TerminalPanel } from "../../components/TerminalPanel";
import { contactContent } from "../../data/pages";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Paul McNally for editorial, publishing, interview and games media enquiries."
};

export default function ContactPage() {
  return (
    <PageContainer
      eyebrow={contactContent.eyebrow}
      title={contactContent.title}
      intro={contactContent.intro}
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <TerminalPanel title={contactContent.panelTitle} tone="green">
          <p className="text-lg leading-8">{contactContent.panelBody}</p>
          <div className="mt-6 grid gap-3 font-mono text-sm uppercase">
            {contactContent.links.map((link) => (
              <a
                key={link.href}
                className="border border-terminal-cyan/50 px-4 py-3 text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow"
                href={link.href}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                target={link.href.startsWith("http") ? "_blank" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
        </TerminalPanel>
        <TerminalPanel title="START A CONVERSATION" tone="cyan">
          <p className="text-lg leading-8">
            Please include a short outline of the project or request, any relevant
            timings, and the best way to reach you. Press enquiries and interview
            invitations are welcome when they are relevant to Paul&apos;s areas of work.
          </p>
          <a
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center border border-terminal-yellow bg-terminal-yellow/10 px-5 py-3 text-center font-mono text-base uppercase text-terminal-yellow shadow-terminal transition-colors hover:bg-terminal-yellow hover:text-terminal-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terminal-cyan sm:w-auto"
            href={contactContent.formAction}
          >
            <span aria-hidden="true">&gt;&nbsp;</span>
            Email Paul
          </a>
          <p className="mt-5 break-all font-mono text-sm text-terminal-paper/75">
            p.mcnally@btopenworld.com
          </p>
        </TerminalPanel>
      </div>
    </PageContainer>
  );
}
