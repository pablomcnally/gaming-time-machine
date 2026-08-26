import type { Metadata } from "next";
import { ReviewCategoryIndex } from "../../../components/ReviewCategoryIndex";

export const metadata: Metadata = {
  title: "Game Reviews",
  description: "Paul McNally's game review archive."
};

export default function GameReviewsPage() {
  return <ReviewCategoryIndex category="games" />;
}
