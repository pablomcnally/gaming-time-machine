import { careerMilestones } from "../data/careerMilestones";

export function CareerMilestones() {
  return (
    <section className="mt-10 border-y border-terminal-cyan/45 bg-terminal-black/65 py-8 md:mt-12 md:py-10" aria-labelledby="career-milestones-heading">
      <div className="px-5 md:px-8">
        <p className="font-mono text-sm uppercase text-terminal-green">Career archive // key dates</p>
        <h2 id="career-milestones-heading" className="mt-3 font-mono text-3xl uppercase text-terminal-yellow md:text-5xl">Career timeline</h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-terminal-paper/85">From a first published review to editorial leadership across magazines, websites, sport and technology.</p>
      </div>

      <ol className="mt-8 grid gap-2 px-5 md:grid-cols-2 md:px-8 lg:grid-cols-1">
        {careerMilestones.map((milestone, index) => (
          <li
            className={`grid min-h-14 grid-cols-[5rem_minmax(0,1fr)] items-center border px-3 py-2 font-mono uppercase md:grid-cols-[6rem_minmax(0,1fr)] ${
              index === 0
                ? "border-terminal-yellow bg-terminal-yellow text-terminal-black"
                : "border-terminal-cyan/50 bg-terminal-black/80 text-terminal-paper"
            }`}
            key={`${milestone.year}-${milestone.label}`}
          >
            <time className="text-xl" dateTime={milestone.year}>{milestone.year}</time>
            <span className="text-xs leading-5 md:text-sm">{milestone.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
