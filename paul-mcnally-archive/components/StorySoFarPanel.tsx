import { homeContent } from "../data/pages";
import { TerminalPanel } from "./TerminalPanel";

export function StorySoFarPanel() {
  return (
    <TerminalPanel title="STORY SO FAR" tone="green">
      <dl className="grid grid-cols-2 border-l border-t border-terminal-green/35">
        {homeContent.storyStats.map((stat) => (
          <div key={stat.label} className="border-b border-r border-terminal-green/35 p-4">
            <dt className="font-mono text-xs uppercase text-terminal-green">{stat.label}</dt>
            <dd className="mt-2 font-mono text-2xl uppercase text-terminal-yellow">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </TerminalPanel>
  );
}
