import type { Metadata } from "next";
import Link from "next/link";
import { aboutContent } from "../../../data/pages";
import { careerEntries } from "../../../data/career";

export const metadata: Metadata = { title: "About", description: aboutContent.intro, alternates: { canonical: "/pro/about" } };

export default function ProfessionalAbout() {
  return <div className="pro-container pro-page">
    <header className="pro-page-heading"><p className="pro-eyebrow">The person behind the byline</p><h1>{aboutContent.title}</h1><p>{aboutContent.intro}</p></header>
    <div className="pro-about-layout"><aside><p className="pro-eyebrow">On this page</p><nav aria-label="About sections">{aboutContent.panels.map((panel, index) => <a href={`#about-${index}`} key={panel.title}>{panel.title.toLowerCase()}</a>)}<a href="#experience">Career timeline</a></nav><Link className="pro-text-link" href="/pro/contact">Get in touch</Link></aside>
      <div>{aboutContent.panels.map((panel, index) => <section className="pro-about-section" id={`about-${index}`} key={panel.title}><h2>{panel.title.toLowerCase()}</h2>{panel.title === "SELECTED PUBLICATIONS" ? <ul className="pro-publication-list">{panel.paragraphs.map((paragraph) => <li key={paragraph}>{paragraph}</li>)}</ul> : panel.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <section className="pro-about-section" id="experience"><h2>Career timeline</h2><ol className="pro-timeline">{[...careerEntries].reverse().map((entry) => <li key={`${entry.year}-${entry.company}`}><time>{entry.range}</time><h3>{entry.role}</h3><p className="pro-company">{entry.company}</p><p>{entry.description}</p></li>)}</ol></section></div>
    </div>
  </div>;
}
