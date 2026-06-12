import type { Metadata } from "next";
import { ContactForm } from "../../components/ContactForm";
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
        <ContactForm action={contactContent.formAction} />
      </div>
    </PageContainer>
  );
}
