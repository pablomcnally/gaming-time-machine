"use client";

type MonthOption = {
  id: string;
  label: string;
  href: string;
};

type MonthSelectorProps = {
  currentMonthId: string;
  months: MonthOption[];
  randomHref: string;
};

export function MonthSelector({ currentMonthId, months, randomHref }: MonthSelectorProps) {
  function visitMonth(monthId: string) {
    const month = months.find((option) => option.id === monthId) ?? months[0];

    if (!month) {
      return;
    }

    window.location.assign(month.href);
  }

  function visitRandomMonth() {
    const target = new URL(randomHref, window.location.origin);
    const current = `${window.location.pathname}${window.location.search}`;

    if (`${target.pathname}${target.search}` === current) {
      window.location.reload();
      return;
    }

    window.location.assign(target.toString());
  }

  return (
    <div className="relative border-b border-stone-100/15 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <label className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-amber-200">Choose month</span>
          <select
            aria-label="Choose exhibit month"
            className="h-11 min-w-52 border border-stone-100/30 bg-stone-50 px-4 font-mono text-xs uppercase tracking-[0.18em] text-zinc-950 outline-none transition focus:border-amber-200 focus:ring-2 focus:ring-amber-200/40"
            value={currentMonthId}
            disabled={months.length === 0}
            onChange={(event) => visitMonth(event.target.value)}
          >
            {months.length > 0 ? (
              months.map((month) => (
                <option key={month.id} value={month.id}>
                  {month.label}
                </option>
              ))
            ) : (
              <option value="">No installed months</option>
            )}
          </select>
        </label>
        <button
          type="button"
          className="h-11 border border-amber-200 bg-amber-200 px-5 font-mono text-xs uppercase tracking-[0.18em] text-zinc-950 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-200/50 focus:ring-offset-2 focus:ring-offset-zinc-950"
          onClick={visitRandomMonth}
        >
          Take me somewhere random
        </button>
      </div>
    </div>
  );
}
