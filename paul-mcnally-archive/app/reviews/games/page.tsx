import type { Metadata } from "next";
import { ReviewCategoryIndex } from "../../../components/ReviewCategoryIndex";

export const metadata: Metadata = {
  title: "Game and Book Reviews",
  description: "Paul McNally's archive of game reviews and gaming book coverage."
};

export default function GameReviewsPage() {
  return <ReviewCategoryIndex category="games" />;
}
