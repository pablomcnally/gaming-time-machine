import type { Metadata } from "next";
import { ContactForm } from "../../../components/ContactForm";
import { contactContent } from "../../../data/pages";

export const metadata: Metadata = { title: "Contact", description: contactContent.intro, alternates: { canonical: "/pro/contact" } };

export default function ProfessionalContact() {
  return <div className="pro-container pro-page">
    <header className="pro-page-heading"><p className="pro-eyebrow">Commissions &amp; conversations</p><h1>Get in touch.</h1><p>{contactContent.intro}</p></header>
    <div className="pro-contact-layout"><section><h2>Have something in mind?</h2><p>{contactContent.panelBody}</p><p>A short outline of the project, the timing and what you need is a good place to start.</p><div className="pro-contact-links">{contactContent.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} <span aria-hidden="true">&#8599;</span><span className="sr-only"> (opens in a new tab)</span></a>)}</div></section>
    <section aria-label="Send a message"><ContactForm action={contactContent.formAction} appearance="professional" /></section></div>
  </div>;
}
