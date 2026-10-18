import { notFound } from "next/navigation";
import { TopicCollection } from "../../../components/TopicPages";
import { getTopic, topics } from "../../../lib/topics";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return topics.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props) { const { slug } = await params; const topic = getTopic(slug); return { title: topic?.title, description: topic?.description, alternates: { canonical: `/topics/${slug}` } }; }
export default async function Page({ params }: Props) { const { slug } = await params; if (!getTopic(slug)) notFound(); return <TopicCollection slug={slug} />; }
