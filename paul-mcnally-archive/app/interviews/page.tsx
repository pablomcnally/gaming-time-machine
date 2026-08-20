import type { Metadata } from "next";
import { PortfolioIndex } from "../../components/PortfolioIndex";

export const metadata: Metadata = {
  title: "Interviews",
  description: "Paul McNally's interview archive: long-form conversations preserved as permanent, readable files."
};

export default function InterviewsPage() {
  return <PortfolioIndex kind="interviews" />;
}
