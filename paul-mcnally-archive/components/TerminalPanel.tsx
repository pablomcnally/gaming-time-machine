type TerminalPanelProps = {
  title: string;
  children: React.ReactNode;
  tone?: "cyan" | "green" | "yellow" | "red";
};

const toneClasses = {
  cyan: "border-terminal-cyan text-terminal-cyan",
  green: "border-terminal-green text-terminal-green",
  yellow: "border-terminal-yellow text-terminal-yellow",
  red: "border-terminal-red text-terminal-red"
};

export function TerminalPanel({ title, children, tone = "cyan" }: TerminalPanelProps) {
  return (
    <section className={`border bg-terminal-black/88 p-5 shadow-terminal md:p-7 ${toneClasses[tone]}`}>
      <div className="mb-5 flex items-center gap-3 border-b border-current/50 pb-3 font-mono text-sm uppercase">
        <span className="inline-block h-3 w-3 bg-current" aria-hidden="true" />
        <h3>{title}</h3>
      </div>
      <div className="text-terminal-paper">{children}</div>
    </section>
  );
}
