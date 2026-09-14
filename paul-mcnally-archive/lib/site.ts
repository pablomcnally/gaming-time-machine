export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://paulmcnally.online").replace(/\/$/, "");

export function absoluteUrl(value: string) {
  return new URL(value, `${SITE_URL}/`).toString();
}
