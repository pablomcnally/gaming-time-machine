const portfolioPreviewImages: Record<string, string> = {
  "eve-fanfest-hilmar-interview-25-years": "/portfolio/home/eve-fanfest-hilmar-pablonet.png",
  "ukrainian-drone-simulator-ufds-training-tool-war-game": "/portfolio/home/ukrainian-drone-simulator-pablonet.png",
  "stern-transformers-pinball-interview": "/portfolio/home/stern-transformers-pinball-pablonet.png",
  "why-old-consoles-computers-go-yellow": "/portfolio/home/yellowed-acorn-electron-pablonet.png",
  "atari-intellivision-sprint-interview": "/portfolio/home/atari-intellivision-sprint.png",
  "bitmap-books-sam-dyer-interview": "/portfolio/home/bitmap-books-micronet.png",
  "forgotten-amberstar-review-copy-resurfaced": "/portfolio/home/amberstar-micronet.png",
  "ere-informatique-french-video-game-revolution": "/portfolio/home/ere-informatique-micronet.png",
  "prestel-micronet-lost-online-world": "/portfolio/home/prestel-micronet.jpg.webp",
  "theatre-europe-nuclear-war-phone-call": "/portfolio/home/theatre-europe-micronet.png",
  "sterre-meijer-skatesterre-interview": "/portfolio/home/sterre-meijer-micronet.png",
  "slipknot-clown-vernearth": "/portfolio/home/slipknot-clown-micronet.png",
  "tim-kitzrow-nba-jam-blitz-mutant-football-league-interview": "/portfolio/home/tim-kitzrow-micronet.png"
};

export function getPortfolioPreviewImage(slug: string) {
  return portfolioPreviewImages[slug];
}
