import type { Metadata } from "next";
import { ContactForm } from "../../components/ContactForm";
import { PageContainer } from "../../components/PageContainer";
import { TerminalPanel } from "../../components/TerminalPanel";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Paul McNally for editorial, publishing, interview and games media enquiries."
};

export default function ContactPage() {
  return (
    <PageContainer
      eyebrow="Service page 600"
      title="Contact"
      intro="For commissions, interviews, editorial work, events, archive questions, or a sensible chat about games and media."
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <TerminalPanel title="CONTACT ROUTES" tone="green">
          <p className="text-lg leading-8">
            Email is the best route for professional enquiries. Short, clear messages are always welcome; ominous
            attachments with no context are less welcome, but that was true in 1996 as well.
          </p>
          <div className="mt-6 grid gap-3 font-mono text-sm uppercase">
            <a className="border border-terminal-cyan/50 px-4 py-3 text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow" href="mailto:hello@example.com">
              hello@example.com
            </a>
            <a className="border border-terminal-cyan/50 px-4 py-3 text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow" href="https://www.linkedin.com/" rel="noreferrer" target="_blank">
              LinkedIn
            </a>
            <a className="border border-terminal-cyan/50 px-4 py-3 text-terminal-cyan hover:border-terminal-yellow hover:text-terminal-yellow" href="https://bsky.app/" rel="noreferrer" target="_blank">
              Bluesky
            </a>
          </div>
        </TerminalPanel>
        <ContactForm />
      </div>
    </PageContainer>
  );
}
