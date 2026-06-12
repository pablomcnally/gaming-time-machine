import type { Metadata } from "next";
import { CareerTimeline } from "../../components/CareerTimeline";
import { PageContainer } from "../../components/PageContainer";
import { careerEntries } from "../../data/career";

export const metadata: Metadata = {
  title: "Career",
  description: "A Viewdata-inspired career timeline for Paul McNally."
};

export default function CareerPage() {
  return (
    <PageContainer
      eyebrow="Service page 300"
      title="Career Timeline"
      intro="A Teletext-style route through print, digital, communications, guides, hardware coverage and current games journalism."
    >
      <CareerTimeline entries={careerEntries} />
    </PageContainer>
  );
}
