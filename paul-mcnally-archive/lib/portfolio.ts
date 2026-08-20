import fs from "node:fs";
import path from "node:path";

export const portfolioKinds = ["interviews", "features"] as const;

export type PortfolioKind = (typeof portfolioKinds)[number];

export type PortfolioPiece = {
  kind: PortfolioKind;
  title: string;
  date: string;
  slug: string;
  excerpt: string;
  publication: string;
  author: string;
  tag?: string;
  featuredImage: string;
  featuredImageAlt: string;
  imageCredit?: string;
  sourceUrl: string;
  body: string;
};

const portfolioDirectory = path.join(process.cwd(), "content", "portfolio");

function parseFrontMatter(fileContents: string) {
  const frontMatterMatch = fileContents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    throw new Error("Portfolio piece is missing front matter.");
  }

  const rawFrontMatter = frontMatterMatch[1];
  const body = frontMatterMatch[2].trim();
  const data = Object.fromEntries(
    rawFrontMatter
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(":");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

        return [key, value];
      })
  );

  return { data, body };
}

function getPiecesForKind(kind: PortfolioKind): PortfolioPiece[] {
  const directory = path.join(portfolioDirectory, kind);

  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const { data, body } = parseFrontMatter(fs.readFileSync(path.join(directory, file), "utf8"));

      return {
        kind,
        title: data.title,
        date: data.date,
        slug: data.slug,
        excerpt: data.excerpt,
        publication: data.publication,
        author: data.author,
        tag: data.tag || undefined,
        featuredImage: data.featuredImage,
        featuredImageAlt: data.featuredImageAlt,
        imageCredit: data.imageCredit || undefined,
        sourceUrl: data.sourceUrl,
        body
      } satisfies PortfolioPiece;
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getAllPortfolioPieces(kind?: PortfolioKind) {
  if (kind) {
    return getPiecesForKind(kind);
  }

  return portfolioKinds.flatMap(getPiecesForKind).sort((left, right) => right.date.localeCompare(left.date));
}

export function getPortfolioPieceBySlug(kind: PortfolioKind, slug: string) {
  return getPiecesForKind(kind).find((piece) => piece.slug === slug);
}

export function getPortfolioKindLabel(kind: PortfolioKind) {
  return kind === "interviews" ? "Interviews" : "Features";
}
