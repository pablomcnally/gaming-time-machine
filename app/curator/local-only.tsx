export function LocalCuratorOnly() {
  return (
    <main className="min-h-screen bg-[#f3efe4] text-zinc-900">
      <header className="relative isolate overflow-hidden bg-zinc-950 px-5 py-12 text-stone-50 md:px-8 md:py-16">
        <div className="absolute inset-0 opacity-35 [background:radial-gradient(circle_at_25%_15%,rgba(255,215,128,.24),transparent_28%),linear-gradient(135deg,#09090b,#1f2937_48%,#3f1d25)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:100%_12px] opacity-20" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.24em]">
            <a href="/" className="text-amber-200 transition hover:text-amber-100">
              Public Archive
            </a>
            <a href="/archive-status" className="text-stone-400 transition hover:text-amber-100">
              Archive Status
            </a>
          </nav>
          <p className="mt-12 font-mono text-xs uppercase tracking-[0.32em] text-red-300">Curator tools</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-none md:text-7xl">Local Tools Only</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
            The exhibit editor writes JSON files directly to the repository, so it only runs on your machine during
            local development.
          </p>
        </div>
      </header>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <article className="max-w-3xl border border-black/10 bg-[#fbf8ef] p-7 shadow-exhibit md:p-9">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-700">How to open the editor</p>
            <pre className="mt-5 overflow-x-auto border border-zinc-950/10 bg-[#f3efe4] p-4 text-sm text-zinc-800">
              npm run dev
            </pre>
            <p className="mt-5 text-base leading-7 text-zinc-600">
              Then visit <code>/curator/exhibits</code> on localhost. On Vercel, this page is intentionally locked down
              to avoid exposing the editor UI.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
