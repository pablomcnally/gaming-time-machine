export function ContactForm() {
  return (
    <form className="grid gap-4 border border-terminal-cyan/50 bg-terminal-black/85 p-5 shadow-terminal md:p-7" action="https://formspree.io/f/replace-me" method="POST">
      {/* Replace the action URL with Formspree, a Vercel Function endpoint, or a Resend-backed API route when ready. */}
      <label className="grid gap-2 font-mono text-sm uppercase text-terminal-cyan">
        Name
        <input className="min-h-12 border border-terminal-cyan/50 bg-black px-4 text-terminal-paper outline-none focus:border-terminal-yellow" name="name" required />
      </label>
      <label className="grid gap-2 font-mono text-sm uppercase text-terminal-cyan">
        Email
        <input className="min-h-12 border border-terminal-cyan/50 bg-black px-4 text-terminal-paper outline-none focus:border-terminal-yellow" name="email" required type="email" />
      </label>
      <label className="grid gap-2 font-mono text-sm uppercase text-terminal-cyan">
        Message
        <textarea className="min-h-40 border border-terminal-cyan/50 bg-black px-4 py-3 text-terminal-paper outline-none focus:border-terminal-yellow" name="message" required />
      </label>
      <button className="min-h-12 border border-terminal-yellow bg-terminal-yellow px-5 py-3 font-mono text-sm uppercase text-terminal-black hover:bg-terminal-paper" type="submit">
        Send message
      </button>
    </form>
  );
}
