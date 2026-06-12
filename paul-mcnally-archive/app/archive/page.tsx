import type { Metadata } from "next";
import { ArchiveGrid } from "../../components/ArchiveGrid";
import { PageContainer } from "../../components/PageContainer";
import { archiveItems } from "../../data/archive";
import { pageLabels } from "../../data/site";

export const metadata: Metadata = {
  title: "Archive",
  description: "A historical collection of magazine, website, event, press and retro material."
};

export default function ArchivePage() {
  return (
    <PageContainer
      eyebrow={pageLabels.archive.eyebrow}
      title={pageLabels.archive.title}
      intro={pageLabels.archive.intro}
    >
      <ArchiveGrid items={archiveItems} />
    </PageContainer>
  );
}
