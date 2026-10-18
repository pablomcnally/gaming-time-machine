import Link from "next/link";
export function FooterStatusBar() {
  return (
    <footer className="border-t border-terminal-cyan/70 bg-terminal-black px-5 py-6 font-mono text-xs uppercase text-terminal-paper">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <p>CONNECTED // PERSONAL ARCHIVE // PRESS START</p>
        <Link className="text-terminal-cyan" href="/topics">Browse by topic</Link>
        <p className="text-terminal-green">SERVICE ACTIVE // 1980s MODE: TASTEFUL</p>
      </div>
    </footer>
  );
}
