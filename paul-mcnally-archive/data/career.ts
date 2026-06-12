import careerData from "./career.json";

export type CareerEntry = {
  year: string;
  range: string;
  role: string;
  company: string;
  description: string;
  image: string;
  link?: string;
};

export const careerEntries = careerData as CareerEntry[];
