export const prestelServerNames = [
  "Dickens",
  "Keats",
  "Bronte",
  "Eliot",
  "Austen",
  "Burns",
  "Constable"
] as const;

export type PrestelServerName = (typeof prestelServerNames)[number];

export function isPrestelServerName(value: string | null): value is PrestelServerName {
  return value !== null && prestelServerNames.includes(value as PrestelServerName);
}

export function pickPrestelServer(random = Math.random): PrestelServerName {
  return prestelServerNames[Math.floor(random() * prestelServerNames.length)];
}
