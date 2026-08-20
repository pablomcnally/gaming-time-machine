import type { Metadata } from "next";
import { PortfolioPiecePage } from "../../../components/PortfolioPiecePage";
import { getAllPortfolioPieces, getPortfolioPieceBySlug } from "../../../lib/portfolio";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPortfolioPieces("interviews").map((piece) => ({ slug: piece.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const piece = getPortfolioPieceBySlug("interviews", slug);

  if (!piece) return { title: "Interview file not found" };

  return {
    title: piece.title,
    description: piece.excerpt,
    alternates: { canonical: `/interviews/${piece.slug}` },
    openGraph: {
      title: piece.title,
      description: piece.excerpt,
      type: "article",
      publishedTime: piece.date,
      authors: [piece.author],
      images: [{ url: piece.featuredImage, alt: piece.featuredImageAlt }]
    },
    twitter: {
      card: "summary_large_image",
      title: piece.title,
      description: piece.excerpt,
      images: [piece.featuredImage]
    }
  };
}

export default async function InterviewPage({ params }: { params: Params }) {
  const { slug } = await params;
  return <PortfolioPiecePage kind="interviews" slug={slug} />;
}
