export const prestelServerNames = [
  "Dickens",
  "Keats",
  "Bronte",
  "Eliot",
  "Austen",
  "Burns",
  "Constable"
] as const;

export const PRESTEL_SERVER_STORAGE_KEY = "paul-mcnally-prestel-server";
export const PRESTEL_CONNECTION_STORAGE_KEY = "paul-mcnally-prestel-connected";

export type PrestelServerName = (typeof prestelServerNames)[number];

export function isPrestelServerName(value: string | null): value is PrestelServerName {
  return value !== null && prestelServerNames.includes(value as PrestelServerName);
}

export function pickPrestelServer(random = Math.random): PrestelServerName {
  return prestelServerNames[Math.floor(random() * prestelServerNames.length)];
}

export function getOrCreatePrestelServer(storage: Pick<Storage, "getItem" | "setItem">) {
  const storedServer = storage.getItem(PRESTEL_SERVER_STORAGE_KEY);

  if (isPrestelServerName(storedServer)) {
    return storedServer;
  }

  const server = pickPrestelServer();
  storage.setItem(PRESTEL_SERVER_STORAGE_KEY, server);
  return server;
}
