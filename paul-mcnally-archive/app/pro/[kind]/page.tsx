import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionPage, collectionDetails } from "../../../components/pro/CollectionPage";
import { isProfessionalKind, professionalKinds } from "../../../lib/professional";

type Props = { params: Promise<{ kind: string }> };
export function generateStaticParams() { return professionalKinds.map((kind) => ({ kind })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind } = await params;
  if (!isProfessionalKind(kind)) return {};
  const details = collectionDetails[kind];
  return { title: details.title, description: details.description, alternates: { canonical: `/pro/${kind}` }, openGraph: { title: `${details.title} | Paul McNally`, description: details.description, url: `/pro/${kind}` } };
}
export default async function ProfessionalCollection({ params }: Props) {
  const { kind } = await params;
  if (!isProfessionalKind(kind)) notFound();
  return <CollectionPage kind={kind} />;
}
