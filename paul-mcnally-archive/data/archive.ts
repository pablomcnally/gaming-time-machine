import archiveData from "./archive.json";

export type ArchiveCategory = "magazines" | "websites" | "events" | "press" | "retro";

export type ArchiveItem = {
  image: string;
  title: string;
  caption: string;
  year: string;
  category: ArchiveCategory;
  publication: string;
  externalLink?: string;
};

export const archiveCategories: { id: ArchiveCategory; label: string }[] = [
  { id: "magazines", label: "Magazines" },
  { id: "websites", label: "Websites" },
  { id: "events", label: "Events" },
  { id: "press", label: "Press" },
  { id: "retro", label: "Retro" }
];

export const archiveItems = archiveData as ArchiveItem[];
