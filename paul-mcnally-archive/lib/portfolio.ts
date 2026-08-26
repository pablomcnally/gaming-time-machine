import fs from "node:fs";
import path from "node:path";

export const portfolioKinds = ["interviews", "features", "reviews"] as const;

export type PortfolioKind = (typeof portfolioKinds)[number];
export type ReviewCategory = "games" | "tech";

export type PortfolioPiece = {
  kind: PortfolioKind;
  title: string;
  date: string;
  updatedDate?: string;
  slug: string;
  excerpt: string;
  publication: string;
  author: string;
  tag?: string;
  category?: ReviewCategory;
  featuredImage?: string;
  featuredImageAlt?: string;
  imageCredit?: string;
  sourceUrl: string;
  directoryPlacement?: "last";
  body: string;
};

export type PortfolioPageEntry = {
  number: string;
  href: string;
  piece: PortfolioPiece;
};

const portfolioDirectories: Record<PortfolioKind, string> = {
  interviews: path.join(process.cwd(), "content", "portfolio", "interviews"),
  features: path.join(process.cwd(), "content", "portfolio", "features"),
  reviews: path.join(process.cwd(), "content", "reviews")
};

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
  const directory = portfolioDirectories[kind];

  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md")
    .map((file) => {
      const { data, body } = parseFrontMatter(fs.readFileSync(path.join(directory, file), "utf8"));
      const category = data.category?.trim().toLowerCase();

      if (kind === "reviews" && category !== "games" && category !== "tech") {
        throw new Error(`Review ${file} must use category: games or category: tech.`);
      }

      return {
        kind,
        title: data.title,
        date: data.date,
        updatedDate: data.updatedDate || undefined,
        slug: data.slug,
        excerpt: data.excerpt,
        publication: data.publication,
        author: data.author,
        tag: data.tag || undefined,
        category: kind === "reviews" ? category as ReviewCategory : undefined,
        featuredImage: data.featuredImage || undefined,
        featuredImageAlt: data.featuredImageAlt || undefined,
        imageCredit: data.imageCredit || undefined,
        sourceUrl: data.sourceUrl,
        directoryPlacement: data.directoryPlacement === "last" ? "last" : undefined,
        body
      } satisfies PortfolioPiece;
    })
    .sort((left, right) => {
      const placementDifference = Number(left.directoryPlacement === "last") - Number(right.directoryPlacement === "last");

      return placementDifference || right.date.localeCompare(left.date);
    });
}

export function getAllPortfolioPieces(kind?: PortfolioKind) {
  if (kind) {
    return getPiecesForKind(kind);
  }

  return portfolioKinds.flatMap(getPiecesForKind).sort((left, right) => right.date.localeCompare(left.date));
}

const portfolioPageStarts: Record<PortfolioKind, number> = {
  interviews: 402,
  features: 502,
  reviews: 704
};

export function getPortfolioPageEntries(kind: PortfolioKind): PortfolioPageEntry[] {
  return getPiecesForKind(kind).map((piece, index) => ({
    number: String(portfolioPageStarts[kind] + index).padStart(3, "0"),
    href: `/${kind}/${piece.slug}`,
    piece
  }));
}

export function getPortfolioPageCode(kind: PortfolioKind, slug: string) {
  return getPortfolioPageEntries(kind).find((entry) => entry.piece.slug === slug)?.number;
}

export function getPortfolioKeyboardPages() {
  return [
    { number: "702", href: "/reviews/games" },
    { number: "703", href: "/reviews/tech" },
    ...portfolioKinds.flatMap((kind) =>
      getPortfolioPageEntries(kind).map(({ number, href }) => ({ number, href }))
    )
  ];
}

export function getPortfolioPieceBySlug(kind: PortfolioKind, slug: string) {
  return getPiecesForKind(kind).find((piece) => piece.slug === slug);
}

export function getPortfolioKindLabel(kind: PortfolioKind) {
  if (kind === "interviews") return "Interviews";
  if (kind === "features") return "Features";
  return "Reviews";
}
