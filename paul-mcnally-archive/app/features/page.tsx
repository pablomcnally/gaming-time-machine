import type { Metadata } from "next";
import { PortfolioIndex } from "../../components/PortfolioIndex";

export const metadata: Metadata = {
  title: "Features",
  description: "Paul McNally's archive of reported features, original stories and deep dives."
};

export default function FeaturesPage() {
  return <PortfolioIndex kind="features" />;
}
