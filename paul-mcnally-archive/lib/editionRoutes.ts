const sharedEditionSections = ["features", "interviews", "opinion", "reviews", "blog"];

export function getProfessionalEditionHref(pathname: string) {
  if (pathname === "/") return "/pro";
  if (pathname === "/about" || pathname === "/contact" || pathname === "/work") return `/pro${pathname}`;
  if (pathname === "/career") return "/pro/about#experience";

  const section = pathname.split("/")[1];

  if (sharedEditionSections.includes(section)) return `/pro${pathname}`;
  if (pathname === "/micronet-800") return "/pro/about#podcast";

  return "/pro/work";
}

export function getPablonetEditionHref(pathname: string) {
  if (pathname === "/pro") return "/";
  if (pathname.startsWith("/pro/")) return pathname.slice(4) || "/";

  return "/";
}
