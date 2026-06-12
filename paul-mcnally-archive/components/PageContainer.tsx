type PageContainerProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
};

export function PageContainer({ eyebrow, title, intro, children }: PageContainerProps) {
  return (
    <main className="min-h-screen">
      <section className="border-b border-terminal-cyan/50 bg-terminal-black px-5 py-12 terminal-grid md:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-sm uppercase text-terminal-green">{eyebrow}</p>
          <h2 className="mt-4 max-w-5xl font-mono text-4xl uppercase leading-tight text-terminal-yellow md:text-6xl">{title}</h2>
          {intro ? <p className="mt-6 max-w-3xl text-lg leading-8 text-terminal-paper">{intro}</p> : null}
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-5 py-10 md:py-14">{children}</div>
    </main>
  );
}
