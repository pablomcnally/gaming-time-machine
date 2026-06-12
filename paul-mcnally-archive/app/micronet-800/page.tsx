import type { Metadata } from "next";
import { PageContainer } from "../../components/PageContainer";
import { TerminalPanel } from "../../components/TerminalPanel";

export const metadata: Metadata = {
  title: "Micronet 800",
  description: "A hidden page for visitors who typed 800."
};

export default function Micronet800Page() {
  return (
    <PageContainer eyebrow="Hidden service" title="Micronet 800 Node" intro="You found the old service route. Very tidy work.">
      <TerminalPanel title="HIDDEN PAGE 800" tone="yellow">
        <p className="text-lg leading-8">
          This page is reserved for future oddities: old screenshots, scanned notes, terminal jokes, and anything that
          would have made more sense after midnight on a dial-up connection.
        </p>
      </TerminalPanel>
    </PageContainer>
  );
}
