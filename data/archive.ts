import { EXHIBIT_MANIFEST, type Exhibit, type ExhibitStatus } from "../lib/exhibits";

export const FIRST_TIMELINE_YEAR = 1975;
export const LAST_TIMELINE_YEAR = 2026;
export const DEFAULT_YEAR = 1997;

export type { Exhibit };

export type { ExhibitStatus };

export const exhibitStatusLabels = {
  "ai-draft": "AI Draft",
  "human-edited": "Human Edited",
  verified: "Verified"
} satisfies Record<ExhibitStatus, string>;

export type ArchiveMonth = {
  id: string;
  label: string;
  href: string;
  exhibit: Exhibit;
};

export type ArchiveYear = {
  year: number;
  href: string;
  hasContent: boolean;
};

export type TimelineMonth = {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  hasContent: boolean;
  isSelected: boolean;
};

const monthsOfYear = [
  { id: "january", label: "January", shortLabel: "Jan" },
  { id: "february", label: "February", shortLabel: "Feb" },
  { id: "march", label: "March", shortLabel: "Mar" },
  { id: "april", label: "April", shortLabel: "Apr" },
  { id: "may", label: "May", shortLabel: "May" },
  { id: "june", label: "June", shortLabel: "Jun" },
  { id: "july", label: "July", shortLabel: "Jul" },
  { id: "august", label: "August", shortLabel: "Aug" },
  { id: "september", label: "September", shortLabel: "Sep" },
  { id: "october", label: "October", shortLabel: "Oct" },
  { id: "november", label: "November", shortLabel: "Nov" },
  { id: "december", label: "December", shortLabel: "Dec" }
];

const monthNames = new Map(monthsOfYear.map((month) => [month.id, month.label]));

const monthOrder = monthsOfYear.map((month) => month.id);

/*
  Future month additions:
  - Keep JSON files in data/<year>/<month>.json, using lowercase month names.
  - Example: data/1998/november.json.
  - Add the file to lib/exhibits.ts so it is statically imported at build time.
  - Any month in the manifest becomes active in the timeline month row.
*/

function getMonthLabel(monthId: string, year: number) {
  const title = monthNames.get(monthId) ?? monthId.replaceAll("-", " ");

  return `${title} ${year}`;
}

function getMonthHref(year: number, monthId: string) {
  return `/?year=${year}&month=${monthId}`;
}

function getContentYears() {
  return Object.keys(EXHIBIT_MANIFEST).map(Number);
}

function getContentMonthIds(year: number) {
  const yearExhibits = EXHIBIT_MANIFEST[year] ?? {};

  return Object.keys(yearExhibits).sort((left, right) => monthOrder.indexOf(left) - monthOrder.indexOf(right));
}

function readMonth(year: number, monthId: string): ArchiveMonth | null {
  const exhibit = EXHIBIT_MANIFEST[year]?.[monthId];

  if (!exhibit) {
    return null;
  }

  return {
    id: monthId,
    label: getMonthLabel(monthId, year),
    href: getMonthHref(year, monthId),
    exhibit
  };
}

export function getArchiveStats() {
  const years = getContentYears();
  const monthlyExhibits = years.reduce((total, year) => total + getContentMonthIds(year).length, 0);

  return {
    yearsInArchive: years.length,
    monthlyExhibits
  };
}

export function getAllExhibitRecords() {
  return getContentYears().flatMap((year) =>
    getContentMonthIds(year).flatMap((monthId) => {
      const month = readMonth(year, monthId);

      return month
        ? [
            {
              year,
              monthId,
              label: month.label,
              href: month.href,
              exhibit: month.exhibit
            }
          ]
        : [];
    })
  );
}

export function getArchiveWorkflowSummary() {
  const records = getAllExhibitRecords();
  const statusCounts = records.reduce(
    (counts, record) => {
      counts[record.exhibit.status] += 1;

      return counts;
    },
    {
      "ai-draft": 0,
      "human-edited": 0,
      verified: 0
    } satisfies Record<ExhibitStatus, number>
  );
  const byYear = records.reduce(
    (years, record) => {
      years[record.year] = [...(years[record.year] ?? []), record];

      return years;
    },
    {} as Record<number, typeof records>
  );

  return {
    totalExhibits: records.length,
    statusCounts,
    byYear
  };
}

export function getRandomExhibitHref() {
  const availableMonths = getContentYears().flatMap((year) =>
    getContentMonthIds(year).map((monthId) => getMonthHref(year, monthId))
  );

  if (availableMonths.length === 0) {
    return `/?year=${DEFAULT_YEAR}&month=october`;
  }

  return availableMonths[Math.floor(Math.random() * availableMonths.length)];
}

export function getTimelineYears(contentYears: number[], selectedYear: number) {
  const contentYearSet = new Set(contentYears);

  return Array.from({ length: LAST_TIMELINE_YEAR - FIRST_TIMELINE_YEAR + 1 }, (_, index) => {
    const year = FIRST_TIMELINE_YEAR + index;
    const hasContent = contentYearSet.has(year);

    return {
      year,
      hasContent,
      href: hasContent ? `/?year=${year}` : `/?year=${year}`,
      isSelected: year === selectedYear
    };
  });
}

export function getTimelineMonths(year: number, contentMonthIds: string[], selectedMonthId?: string) {
  const contentMonthSet = new Set(contentMonthIds);

  return monthsOfYear.map((month) => ({
    ...month,
    href: getMonthHref(year, month.id),
    hasContent: contentMonthSet.has(month.id),
    isSelected: month.id === selectedMonthId
  }));
}

export async function getArchiveSelection(yearParam?: string, monthParam?: string) {
  const contentYears = getContentYears();
  const requestedYear = Number(yearParam);
  const selectedYear =
    requestedYear >= FIRST_TIMELINE_YEAR && requestedYear <= LAST_TIMELINE_YEAR ? requestedYear : DEFAULT_YEAR;
  const monthIds = contentYears.includes(selectedYear) ? getContentMonthIds(selectedYear) : [];

  const selectedMonthId = monthParam && monthIds.includes(monthParam) ? monthParam : monthIds[0];
  const months = monthIds
    .map((monthId) => readMonth(selectedYear, monthId))
    .filter((month): month is ArchiveMonth => Boolean(month));
  const currentMonth = months.find((month) => month.id === selectedMonthId) ?? months[0] ?? null;

  return {
    selectedYear,
    currentMonth,
    months,
    timelineYears: getTimelineYears(contentYears, selectedYear),
    timelineMonths: getTimelineMonths(selectedYear, monthIds, currentMonth?.id)
  };
}

/*
  Future archive additions:
  - Add a folder named for the year, such as data/1998.
  - Drop one JSON file per month into that folder, such as data/1998/november.json.
  - Register each file in lib/exhibits.ts with a static import and manifest entry.
  - Use the same schema as data/1997/october.json: museum, sections, and sources.
  - Magazine cover entries can include coverImage, coverImageAlt, publicationName, issueDate, and curatorNote.
  - The year timeline and month selector read from the manifest so Vercel never scans /data at runtime.
*/
