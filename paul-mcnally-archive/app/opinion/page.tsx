import type { Metadata } from "next";
import { PortfolioIndex } from "../../components/PortfolioIndex";

export const metadata: Metadata = {
  title: "Opinion Pieces",
  description: "Paul McNally's columns, commentary and opinion on games, technology and culture.",
  alternates: { canonical: "/opinion" }
};

export default function OpinionPage() {
  return <PortfolioIndex kind="opinion" />;
}
