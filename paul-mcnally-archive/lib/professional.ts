import { getAllBlogPosts } from "./blog";
import { getAllPortfolioPieces, type PortfolioPiece } from "./portfolio";

export const professionalKinds = ["features", "interviews", "reviews", "blog"] as const;
export type ProfessionalKind = (typeof professionalKinds)[number];
export type ProfessionalArticle = Omit<PortfolioPiece, "kind" | "sourceUrl"> & {
  kind: ProfessionalKind;
  sourceUrl?: string;
};
export type ProfessionalSummary = Omit<ProfessionalArticle, "body">;

export function isProfessionalKind(value: string): value is ProfessionalKind {
  return professionalKinds.some((kind) => kind === value);
}

export function getProfessionalArticles(kind?: ProfessionalKind): ProfessionalArticle[] {
  const articles: ProfessionalArticle[] = [
    ...getAllPortfolioPieces(),
    ...getAllBlogPosts().map((post) => ({ ...post, kind: "blog" as const, publication: "Independent writing" }))
  ];
  return articles.filter((article) => !kind || article.kind === kind)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getProfessionalSummaries(kind?: ProfessionalKind): ProfessionalSummary[] {
  return getProfessionalArticles(kind).map(({ body: _body, ...summary }) => summary);
}

export function getProfessionalArticle(kind: ProfessionalKind, slug: string) {
  return getProfessionalArticles(kind).find((article) => article.slug === slug);
}
