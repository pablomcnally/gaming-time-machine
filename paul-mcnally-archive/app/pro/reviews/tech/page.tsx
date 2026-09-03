import type { Metadata } from "next";
import { CollectionPage } from "../../../../components/pro/CollectionPage";
export const metadata: Metadata = { title: "Tech reviews", alternates: { canonical: "/pro/reviews/tech" } };
export default function TechReviews() { return <CollectionPage kind="reviews" category="tech" />; }
