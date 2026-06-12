import aboutData from "./about.json";
import contactData from "./contact.json";
import homeData from "./home.json";

export type TerminalTone = "cyan" | "green" | "yellow" | "red";

export type AboutContent = {
  eyebrow: string;
  title: string;
  intro: string;
  panels: Array<{
    title: string;
    tone: TerminalTone;
    paragraphs: string[];
  }>;
};

export type ContactContent = {
  eyebrow: string;
  title: string;
  intro: string;
  panelTitle: string;
  panelBody: string;
  links: Array<{
    label: string;
    href: string;
  }>;
  formAction: string;
};

export type HomeContent = {
  taglineParts: string[];
  welcomeTitle: string;
  introLines: string[];
  readMoreLabel: string;
  status: {
    title: string;
    state: string;
    user: string;
    location: string;
    service: string;
  };
  latestTitle: string;
  latestCounter: string;
  latestCtaLabel: string;
  selectedWorkTitle: string;
  selectedWorkCounter: string;
  storyStats: Array<{
    label: string;
    value: string;
  }>;
};

export const aboutContent = aboutData as AboutContent;
export const contactContent = contactData as ContactContent;
export const homeContent = homeData as HomeContent;
