import { storyStats } from "../data/site";
import { TerminalPanel } from "./TerminalPanel";

export function StorySoFarPanel() {
  return (
    <TerminalPanel title="STORY SO FAR" tone="green">
      <dl className="grid gap-3 sm:grid-cols-2">
        {storyStats.map((stat) => (
          <div key={stat.label} className="border border-terminal-green/40 bg-terminal-green/10 p-4">
            <dt className="font-mono text-xs uppercase text-terminal-green">{stat.label}</dt>
            <dd className="mt-2 font-mono text-2xl uppercase text-terminal-yellow">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </TerminalPanel>
  );
}
