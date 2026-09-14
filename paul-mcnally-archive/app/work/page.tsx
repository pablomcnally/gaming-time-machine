import type { Metadata } from "next";
import { PageContainer } from "../../components/PageContainer";
import { WorkLibrary } from "../../components/pro/WorkLibrary";
import { pageLabels } from "../../data/site";
import { getProfessionalSummaries } from "../../lib/professional";

export const metadata: Metadata = {
  title: "Complete Work Index",
  description: "Search Paul McNally's portfolio of magazine, website, event, editorial and retro media work."
};

export default function WorkPage() {
  const articles = getProfessionalSummaries();

  return (
    <PageContainer
      eyebrow={pageLabels.work.eyebrow}
      title={pageLabels.work.title}
      intro={pageLabels.work.intro}
    >
      <WorkLibrary articles={articles} edition="micronet" />
    </PageContainer>
  );
}
