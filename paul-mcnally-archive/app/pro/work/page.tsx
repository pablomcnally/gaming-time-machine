import type { Metadata } from "next";
import { CollectionPage } from "../../../components/pro/CollectionPage";

export const metadata: Metadata = { title: "Work", description: "Explore Paul McNally's features, interviews, reviews and independent writing.", alternates: { canonical: "/pro/work" } };
export default function WorkPage() { return <CollectionPage />; }
