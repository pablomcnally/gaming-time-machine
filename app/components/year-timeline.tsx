type TimelineYear = {
  year: number;
  href: string;
  hasContent: boolean;
  isSelected: boolean;
};

type TimelineMonth = {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  hasContent: boolean;
  isSelected: boolean;
};

export function YearTimeline({ months, selectedYear, years }: { months: TimelineMonth[]; selectedYear: number; years: TimelineYear[] }) {
  return (
    <section id="timeline-archive" className="border-y border-black/10 bg-[#e7efe7]" aria-label="Historical timeline">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-700">Timeline archive</p>
            <h2 className="mt-2 font-display text-3xl text-zinc-950 md:text-4xl">Select a year</h2>
          </div>
        </div>

        <div className="mt-7 overflow-x-auto pb-3 [scrollbar-color:#18181b_transparent]">
          <div className="relative flex min-w-max items-end gap-1 border-b border-zinc-950/25 pb-5">
            {years.map((year) => (
              <a
                key={year.year}
                href={year.href}
                aria-current={year.isSelected ? "date" : undefined}
                className={[
                  "group relative flex w-16 flex-col items-center gap-3 pt-5 text-center font-mono text-xs transition",
                  year.isSelected ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-950"
                ].join(" ")}
              >
                <span
                  className={[
                    "h-8 w-px transition",
                    year.isSelected
                      ? "bg-red-700"
                      : year.hasContent
                        ? "bg-zinc-950/60 group-hover:bg-red-700"
                        : "bg-zinc-950/20 group-hover:bg-zinc-950/50"
                  ].join(" ")}
                />
                <span
                  className={[
                    "absolute top-[2.85rem] h-3 w-3 -translate-y-1/2 rotate-45 border transition",
                    year.isSelected
                      ? "border-red-700 bg-red-700"
                      : year.hasContent
                        ? "border-zinc-950 bg-[#e7efe7] group-hover:border-red-700"
                        : "border-zinc-950/30 bg-[#e7efe7] group-hover:border-zinc-950"
                  ].join(" ")}
                />
                <span className={year.isSelected ? "font-bold" : ""}>{year.year}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 border border-zinc-950/15 bg-[#f3efe4]/70 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">{selectedYear} month drawer</p>
            <p className="text-sm leading-6 text-zinc-600">Installed months are active; empty drawers are held for future exhibits.</p>
          </div>
          <div className="mt-4 overflow-x-auto pb-1 [scrollbar-color:#18181b_transparent]">
            <div className="grid min-w-[48rem] grid-cols-12 gap-2">
              {months.map((month) =>
                month.hasContent ? (
                  <a
                    key={month.id}
                    href={month.href}
                    aria-current={month.isSelected ? "date" : undefined}
                    className={[
                      "group relative border px-3 py-3 text-center font-mono text-xs uppercase tracking-[0.16em] transition",
                      month.isSelected
                        ? "border-red-700 bg-red-700 text-stone-50 shadow-exhibit"
                        : "border-zinc-950 bg-[#fbf8ef] text-zinc-950 hover:-translate-y-0.5 hover:border-red-700"
                    ].join(" ")}
                    title={`${month.label} ${selectedYear}`}
                  >
                    <span className="block">{month.shortLabel}</span>
                    <span
                      className={[
                        "mx-auto mt-2 block h-1.5 w-1.5 rotate-45",
                        month.isSelected ? "bg-stone-50" : "bg-red-700 group-hover:bg-zinc-950"
                      ].join(" ")}
                    />
                  </a>
                ) : (
                  <span
                    key={month.id}
                    className={[
                      "cursor-not-allowed border border-dashed px-3 py-3 text-center font-mono text-xs uppercase tracking-[0.16em]",
                      month.isSelected
                        ? "border-red-700 bg-[#fbf8ef] text-red-700 shadow-exhibit"
                        : "border-zinc-950/20 text-zinc-400"
                    ].join(" ")}
                    aria-disabled="true"
                    title={`${month.label} ${selectedYear} exhibit under construction`}
                  >
                    <span className="block">{month.shortLabel}</span>
                    <span
                      className={[
                        "mx-auto mt-2 block h-1.5 w-1.5 rotate-45",
                        month.isSelected ? "bg-red-700" : "bg-zinc-950/20"
                      ].join(" ")}
                    />
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
