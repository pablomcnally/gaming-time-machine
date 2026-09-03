import type { Metadata } from "next";
import { CollectionPage } from "../../../../components/pro/CollectionPage";
export const metadata: Metadata = { title: "Game reviews", alternates: { canonical: "/pro/reviews/games" } };
export default function GameReviews() { return <CollectionPage kind="reviews" category="games" />; }
