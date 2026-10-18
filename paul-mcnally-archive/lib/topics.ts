export const topics = [
  { slug: "3d-printing-and-making", title: "3D printing & making", description: "Build a games room of your own, from resin miniatures and custom keycaps to UV printing and laser-cut cockpit panels.", pattern: /3d print|3d scan|resin|laser cut|uv print|gktwo|saturn 4|bambu|eufymake|acmer|moose/i },
  { slug: "simulation", title: "Simulation", description: "Flight, driving and virtual worlds: the software, hardware and people bringing simulations to life.", pattern: /simulat|dcs.world|head.track|delanclip|drone.sim|eve.online/i },
  { slug: "retro-computing", title: "Retro computing", description: "Old computers, early online worlds and the people preserving their stories, from Micronet to MiSTer FPGA.", pattern: /retro.gaming|retro.comput|amiga|commodore|mister|fpga|prestel|micronet|amberstar|intellivision|8bitdo|ere-informatique|jobs-vs-gates|old.consoles/i },
  { slug: "arcade-history", title: "Arcade history", description: "Coin-ops, pinball and arcade sports, told through interviews, books and the games that brought people together.", pattern: /arcade|pinball|bitmap.books|nba.jam|kitzrow|mutant.football|ssx/i }
] as const;

export type TopicArticle = { title: string; slug: string; tag?: string; topics?: string[] };
export function getArticleTopics(article: TopicArticle) {
  const subject = `${article.title} ${article.slug} ${article.tag || ""}`;
  return topics.filter((topic) => article.topics?.includes(topic.slug) || topic.pattern.test(subject));
}
export function getTopic(slug: string) { return topics.find((topic) => topic.slug === slug); }
export function articlesForTopic<T extends TopicArticle>(slug: string, articles: T[]) {
  return articles.filter((article) => getArticleTopics(article).some((topic) => topic.slug === slug));
}
