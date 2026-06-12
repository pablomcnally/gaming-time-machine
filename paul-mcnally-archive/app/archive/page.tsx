import type { Metadata } from "next";
import { ArchiveGrid } from "../../components/ArchiveGrid";
import { PageContainer } from "../../components/PageContainer";
import { archiveItems } from "../../data/archive";

export const metadata: Metadata = {
  title: "Archive",
  description: "A historical collection of magazine, website, event, press and retro material."
};

export default function ArchivePage() {
  return (
    <PageContainer
      eyebrow="Service page 500"
      title="Archive"
      intro="A historical collection rather than a gallery: magazines, websites, events, press work and retro systems arranged as inspectable archive cards."
    >
      <ArchiveGrid items={archiveItems} />
    </PageContainer>
  );
}
