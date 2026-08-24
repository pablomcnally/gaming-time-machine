import type { Metadata } from "next";
import { ArchiveGrid } from "../../components/ArchiveGrid";
import { PageContainer } from "../../components/PageContainer";
import { archiveItems } from "../../data/archive";
import { pageLabels } from "../../data/site";

export const metadata: Metadata = {
  title: "Complete Work Index",
  description: "Search Paul McNally's portfolio of magazine, website, event, editorial and retro media work."
};

export default function WorkPage() {
  return (
    <PageContainer
      eyebrow={pageLabels.work.eyebrow}
      title={pageLabels.work.title}
      intro={pageLabels.work.intro}
    >
      <ArchiveGrid items={archiveItems} />
    </PageContainer>
  );
}
