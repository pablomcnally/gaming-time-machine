export type CareerEntry = {
  year: string;
  range: string;
  role: string;
  company: string;
  description: string;
  image: string;
  link?: string;
};

export const careerEntries: CareerEntry[] = [
  {
    year: "1989",
    range: "Late 1980s",
    role: "First published work",
    company: "Early games and computing press",
    description:
      "The first step from reader to contributor: sending copy into a magazine world that still smelt of layout boards, printer ink, and very strong tea.",
    image: "/archive/terminal-room.svg"
  },
  {
    year: "1994",
    range: "1990s",
    role: "Magazine journalist and editor",
    company: "Games magazines",
    description:
      "Reviews, previews, features, interviews, deadlines, embargoes, cover lines, and the odd all-night session trying to finish a game before the courier arrived.",
    image: "/archive/magazine-desk.svg"
  },
  {
    year: "2000",
    range: "2000-2005",
    role: "Digital and broadcast-adjacent work",
    company: "BSkyB",
    description:
      "A move into a broader media world, taking the instincts learned in magazines into fast-moving digital production and editorial work.",
    image: "/archive/online-service.svg"
  },
  {
    year: "2005",
    range: "2005-2014",
    role: "Communications and publishing",
    company: "Rugby communications",
    description:
      "A useful spell outside the games bubble, working with events, audiences, messaging, and the kind of practical communications that makes editorial theory behave itself.",
    image: "/archive/event-pass.svg"
  },
  {
    year: "2015",
    range: "2015-2020",
    role: "Editorial and publishing lead",
    company: "Gamer Guides",
    description:
      "Guides, books, digital publishing, production systems, and the surprisingly deep discipline of making useful information easy to navigate.",
    image: "/archive/guidebook.svg"
  },
  {
    year: "2020",
    range: "2020-2025",
    role: "Editorial leadership",
    company: "WePC",
    description:
      "Hardware, games, SEO, commerce, editorial strategy, and the daily business of keeping useful coverage sharp in a loud online world.",
    image: "/archive/hardware-bench.svg"
  },
  {
    year: "2025",
    range: "2025-present",
    role: "Games journalist and editor",
    company: "The Escapist and freelance work",
    description:
      "Current writing and editorial work across games, culture, tech, and the strange business of explaining modern games to people who remember when loading screens made noises.",
    image: "/archive/press-terminal.svg"
  }
];
