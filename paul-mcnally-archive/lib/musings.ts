import musingsData from "../data/musings.json";

export type Musing = {
  id: string;
  title: string;
  date: string;
  category: string;
  body: string;
  href: string;
};

export function getAllMusings() {
  return (musingsData as Musing[]).slice().sort((left, right) => right.date.localeCompare(left.date));
}

export function getLatestMusings(limit = 5) {
  return getAllMusings().slice(0, limit);
}
