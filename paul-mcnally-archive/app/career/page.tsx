import type { Metadata } from "next";
import { CareerTimeline } from "../../components/CareerTimeline";
import { PageContainer } from "../../components/PageContainer";
import { careerEntries } from "../../data/career";
import { pageLabels } from "../../data/site";

export const metadata: Metadata = {
  title: "Career",
  description: "A Viewdata-inspired career timeline for Paul McNally."
};

export default function CareerPage() {
  return (
    <PageContainer
      eyebrow={pageLabels.career.eyebrow}
      title={pageLabels.career.title}
      intro={pageLabels.career.intro}
    >
      <CareerTimeline entries={careerEntries} />
    </PageContainer>
  );
}
