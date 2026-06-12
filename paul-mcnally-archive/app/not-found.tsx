import Link from "next/link";
import { PageContainer } from "../components/PageContainer";
import { TerminalPanel } from "../components/TerminalPanel";

export default function NotFound() {
  return (
    <PageContainer eyebrow="404" title="Page Not In Service">
      <TerminalPanel title="SYSTEM MESSAGE" tone="red">
        <p>
          The requested page is not available on this archive node. It may have moved, been renamed, or be waiting in a
          box of unlabelled floppy disks.
        </p>
        <Link className="mt-6 inline-flex border border-terminal-yellow px-4 py-3 font-mono text-sm text-terminal-yellow" href="/">
          Return to home
        </Link>
      </TerminalPanel>
    </PageContainer>
  );
}
