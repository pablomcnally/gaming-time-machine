import type { Metadata } from "next";
import { ArticlePublisher } from "../../../components/ArticlePublisher";
export const metadata: Metadata = { title: "Add an archive article", robots: { index: false, follow: false } };
export default function Page() { return <ArticlePublisher />; }
