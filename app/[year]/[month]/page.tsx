import type { Metadata } from "next";
import { getAllExhibitRecords, getArchiveSelection } from "../../../data/archive";
import { ExhibitPage } from "../../page";

type ExhibitRouteParams = Promise<{
  year: string;
  month: string;
}>;

export function generateStaticParams() {
  return getAllExhibitRecords().map((record) => ({
    year: String(record.year),
    month: record.monthId
  }));
}

export async function generateMetadata({ params }: { params: ExhibitRouteParams }): Promise<Metadata> {
  const { year, month } = await params;
  const { currentMonth, selectedYear } = await getArchiveSelection(year, month);

  if (!currentMonth) {
    return {
      title: `${selectedYear} Exhibit Under Construction | Gaming Time Machine`,
      description: `The Gaming Time Machine archive drawer for ${selectedYear} is under construction.`
    };
  }

  return {
    title: `${currentMonth.label} | Gaming Time Machine`,
    description: currentMonth.exhibit.museum.dek
  };
}

export default async function ExhibitRoute({ params }: { params: ExhibitRouteParams }) {
  const { year, month } = await params;

  return <ExhibitPage yearParam={year} monthParam={month} />;
}
