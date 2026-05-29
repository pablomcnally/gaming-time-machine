import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const FIRST_TIMELINE_YEAR = 1975;
export const LAST_TIMELINE_YEAR = 2026;
export const DEFAULT_YEAR = 1997;

export type Exhibit = {
  museum: {
    name: string;
    period: string;
    accession: string;
    dek: string;
    curatorNote: string;
    statusChips: string[];
  };
  sections: {
    id: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    items: {
      title: string;
      body: string;
      [key: string]: unknown;
    }[];
  }[];
  sources: {
    label: string;
    url: string;
  }[];
};

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
  - Drop JSON files into data/<year>/<month>.json, using lowercase month names.
  - Example: data/1998/november.json.
  - Any month with a matching JSON file becomes active in the timeline month row automatically.
*/

function getArchiveRoot() {
  return path.join(process.cwd(), "data");
}

function getMonthLabel(monthId: string, year: number) {
  const title = monthNames.get(monthId) ?? monthId.replaceAll("-", " ");

  return `${title} ${year}`;
}

function getMonthHref(year: number, monthId: string) {
  return `/?year=${year}&month=${monthId}`;
}

async function listYearFolders() {
  const entries = await readdir(getArchiveRoot(), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name))
    .map((entry) => Number(entry.name));
}

async function readMonth(year: number, monthId: string): Promise<ArchiveMonth | null> {
  try {
    const filePath = path.join(getArchiveRoot(), String(year), `${monthId}.json`);
    const exhibit = JSON.parse(await readFile(filePath, "utf8")) as Exhibit;

    return {
      id: monthId,
      label: getMonthLabel(monthId, year),
      href: getMonthHref(year, monthId),
      exhibit
    };
  } catch {
    return null;
  }
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
  const contentYears = await listYearFolders();
  const requestedYear = Number(yearParam);
  const selectedYear =
    requestedYear >= FIRST_TIMELINE_YEAR && requestedYear <= LAST_TIMELINE_YEAR ? requestedYear : DEFAULT_YEAR;
  const monthEntries = selectedYear && contentYears.includes(selectedYear)
    ? await readdir(path.join(getArchiveRoot(), String(selectedYear)), { withFileTypes: true })
    : [];
  const monthIds = monthEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/, ""))
    .sort((left, right) => monthOrder.indexOf(left) - monthOrder.indexOf(right));

  const selectedMonthId = monthParam && monthIds.includes(monthParam) ? monthParam : monthIds[0];
  const months = (
    await Promise.all(monthIds.map((monthId) => readMonth(selectedYear, monthId)))
  ).filter((month): month is ArchiveMonth => Boolean(month));
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
  - Use the same schema as data/1997/october.json: museum, sections, and sources.
  - Magazine cover entries can include coverImage, coverImageAlt, publicationName, issueDate, and curatorNote.
  - The year timeline and month selector discover those files automatically.
*/
