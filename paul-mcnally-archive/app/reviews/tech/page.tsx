import type { Metadata } from "next";
import { ReviewCategoryIndex } from "../../../components/ReviewCategoryIndex";

export const metadata: Metadata = {
  title: "Tech Reviews",
  description: "Paul McNally's technology and hardware review archive."
};

export default function TechReviewsPage() {
  return <ReviewCategoryIndex category="tech" />;
}
