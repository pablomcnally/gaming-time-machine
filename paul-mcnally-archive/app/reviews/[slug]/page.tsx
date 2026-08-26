import type { Metadata } from "next";
import { PortfolioPiecePage } from "../../../components/PortfolioPiecePage";
import { getAllPortfolioPieces, getPortfolioPieceBySlug } from "../../../lib/portfolio";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPortfolioPieces("reviews").map((piece) => ({ slug: piece.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const piece = getPortfolioPieceBySlug("reviews", slug);

  if (!piece) return { title: "Review file not found" };

  const images = piece.featuredImage ? [{ url: piece.featuredImage, alt: piece.featuredImageAlt || "" }] : undefined;

  return {
    title: piece.title,
    description: piece.excerpt,
    alternates: { canonical: `/reviews/${piece.slug}` },
    openGraph: {
      title: piece.title,
      description: piece.excerpt,
      type: "article",
      publishedTime: piece.date,
      authors: [piece.author],
      images
    },
    twitter: {
      card: piece.featuredImage ? "summary_large_image" : "summary",
      title: piece.title,
      description: piece.excerpt,
      images: piece.featuredImage ? [piece.featuredImage] : undefined
    }
  };
}

export default async function ReviewPage({ params }: { params: Params }) {
  const { slug } = await params;
  return <PortfolioPiecePage kind="reviews" slug={slug} />;
}
