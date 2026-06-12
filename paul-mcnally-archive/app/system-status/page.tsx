import type { Metadata } from "next";
import { PageContainer } from "../../components/PageContainer";
import { TerminalPanel } from "../../components/TerminalPanel";

export const metadata: Metadata = {
  title: "System Status",
  description: "A hidden system status page for the personal archive terminal."
};

export default function SystemStatusPage() {
  return (
    <PageContainer eyebrow="Hidden service" title="System Status" intro="A lightweight status page for the archive terminal. No modem required.">
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ["Archive", "Online"],
          ["Writing files", "Indexed"],
          ["Coffee level", "Under review"]
        ].map(([label, value]) => (
          <TerminalPanel key={label} title={label} tone="green">
            <p className="font-mono text-3xl uppercase text-terminal-yellow">{value}</p>
          </TerminalPanel>
        ))}
      </div>
    </PageContainer>
  );
}
