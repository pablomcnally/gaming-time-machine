export const navigationItems = [
  { number: "1", label: "Home", href: "/" },
  { number: "2", label: "About", href: "/about" },
  { number: "3", label: "Career", href: "/career" },
  { number: "4", label: "Writing", href: "/writing" },
  { number: "5", label: "Archive", href: "/archive" },
  { number: "6", label: "Contact", href: "/contact" }
];

export const pageLabels = {
  career: {
    eyebrow: "Service page 300",
    title: "Career Timeline",
    intro: "A Teletext-style route through print, digital, communications, guides, hardware coverage and current games journalism."
  },
  archive: {
    eyebrow: "Service page 500",
    title: "Archive",
    intro: "A historical collection rather than a gallery: magazines, websites, events, press work and retro systems arranged as inspectable archive cards."
  }
};

export const selectedWork = [
  {
    title: "Magazine Years",
    href: "/career",
    description: "Print deadlines, cover meetings, review trips, proof pages, and the noble art of cutting 300 words at 2am."
  },
  {
    title: "Modern Editorial",
    href: "/writing",
    description: "A working archive of games coverage, opinion, features, explainers, and the occasional necessary rant."
  },
  {
    title: "Retro Computing",
    href: "/archive?category=retro",
    description: "Old terminals, forgotten formats, early online systems, and the thrill of a loading screen that might actually finish."
  }
];
