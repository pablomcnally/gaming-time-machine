"use client";

import { FormEvent, useState } from "react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

const fieldClasses =
  "min-h-12 w-full border border-terminal-cyan/50 bg-black px-4 text-base text-terminal-paper outline-none transition-colors placeholder:text-terminal-paper/40 focus:border-terminal-yellow focus-visible:ring-2 focus-visible:ring-terminal-yellow/40 disabled:cursor-wait disabled:opacity-60";

export function ContactForm({ action, appearance = "terminal" }: { action: string; appearance?: "terminal" | "professional" }) {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    setSubmissionState("submitting");

    try {
      const response = await fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Formspree rejected the submission");
      }

      form.reset();
      setSubmissionState("success");
    } catch {
      setSubmissionState("error");
    }
  };

  const isSubmitting = submissionState === "submitting";

  return (
    <form className={`relative mt-6 grid gap-4 ${appearance === "professional" ? "pro-contact-form" : ""}`} action={action} method="POST" onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Leave this field empty
          <input autoComplete="off" name="_gotcha" tabIndex={-1} type="text" />
        </label>
      </div>

      <label className="grid gap-2 font-mono text-sm uppercase text-terminal-cyan">
        Name
        <input
          className={fieldClasses}
          autoComplete="name"
          disabled={isSubmitting}
          maxLength={120}
          name="name"
          required
          type="text"
        />
      </label>

      <label className="grid gap-2 font-mono text-sm uppercase text-terminal-cyan">
        Reply email
        <input
          className={fieldClasses}
          autoComplete="email"
          disabled={isSubmitting}
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>

      <label className="grid gap-2 font-mono text-sm uppercase text-terminal-cyan">
        Subject
        <input
          className={fieldClasses}
          disabled={isSubmitting}
          maxLength={160}
          name="subject"
          required
          type="text"
        />
      </label>

      <label className="grid gap-2 font-mono text-sm uppercase text-terminal-cyan">
        Message
        <textarea
          className={`${fieldClasses} min-h-44 resize-y py-3`}
          disabled={isSubmitting}
          maxLength={5000}
          name="message"
          required
          rows={7}
        />
      </label>

      <button
        className="min-h-12 border border-terminal-yellow bg-terminal-yellow px-5 py-3 font-mono text-sm uppercase text-terminal-black transition-colors hover:bg-terminal-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terminal-cyan disabled:cursor-wait disabled:border-terminal-paper/50 disabled:bg-terminal-paper/50"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (appearance === "professional" ? "Sending..." : "Transmitting...") : "Send message"}
      </button>

      <div className="min-h-7 font-mono text-sm" aria-live="polite" aria-atomic="true">
        {submissionState === "success" ? (
          <p className="text-terminal-green" role="status">
            Message received. Thank you.
          </p>
        ) : null}
        {submissionState === "error" ? (
          <p className="text-terminal-red" role="alert">
            {appearance === "professional" ? "Your message could not be sent. Please check your connection and try again." : "Transmission failed. Please check your connection and try again."}
          </p>
        ) : null}
      </div>
    </form>
  );
}
