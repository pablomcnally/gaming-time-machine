import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ArchiveRedirect({ searchParams }: { searchParams: SearchParams }) {
  const suppliedParams = await searchParams;
  const targetParams = new URLSearchParams();

  Object.entries(suppliedParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => targetParams.append(key, item));
    } else if (value !== undefined) {
      targetParams.set(key, value);
    }
  });

  const query = targetParams.toString();
  redirect(`/work${query ? `?${query}` : ""}`);
}
