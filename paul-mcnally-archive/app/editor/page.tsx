"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Musing } from "../../lib/musings";

const emptyMusing = (): Musing => ({
  id: `musing-${Date.now().toString().slice(-8)}`,
  title: "New short musing",
  date: new Date().toISOString().slice(0, 10),
  category: "Musing",
  body: "A short thought for the archive.",
  href: ""
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function EditorPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [musings, setMusings] = useState<Musing[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("Enter the editor password to load musings.");
  const [isSaving, setIsSaving] = useState(false);
  const selectedMusing = useMemo(() => musings.find((musing) => musing.id === selectedId) ?? musings[0], [musings, selectedId]);

  useEffect(() => {
    const savedPassword = window.sessionStorage.getItem("paulArchiveEditorPassword");

    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  function getHeaders(nextPassword = password) {
    return {
      "Content-Type": "application/json",
      "x-editor-password": nextPassword
    };
  }

  async function loadMusings(nextPassword = password) {
    setStatus("Loading musings...");
    const response = await fetch("/api/musings", {
      headers: getHeaders(nextPassword)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Could not load musings.");
    }

    setMusings(result.data);
    setSelectedId(result.data[0]?.id || "");
    setIsUnlocked(true);
    setStatus(result.mode === "local" ? "Musings loaded from local JSON." : "Musings loaded from GitHub.");
  }

  async function unlockEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.sessionStorage.setItem("paulArchiveEditorPassword", password);

    try {
      await loadMusings(password);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not unlock editor.");
    }
  }

  function updateSelectedMusing(field: keyof Musing, value: string) {
    if (!selectedMusing) {
      return;
    }

    setMusings((currentMusings) =>
      currentMusings.map((musing) => (musing.id === selectedMusing.id ? { ...musing, [field]: value } : musing))
    );
  }

  function addMusing() {
    const nextMusing = emptyMusing();
    setMusings((currentMusings) => [nextMusing, ...currentMusings]);
    setSelectedId(nextMusing.id);
    setStatus("New musing added. Edit it, then save.");
  }

  function duplicateMusing() {
    if (!selectedMusing) {
      return;
    }

    const copy = {
      ...selectedMusing,
      id: `${selectedMusing.id}-copy`,
      title: `${selectedMusing.title} Copy`
    };
    const selectedIndex = musings.findIndex((musing) => musing.id === selectedMusing.id);
    const nextMusings = musings.slice();
    nextMusings.splice(selectedIndex + 1, 0, copy);
    setMusings(nextMusings);
    setSelectedId(copy.id);
    setStatus("Musing duplicated. Update the id before saving.");
  }

  function deleteMusing() {
    if (!selectedMusing || musings.length <= 1) {
      setStatus("Keep at least one musing.");
      return;
    }

    if (!window.confirm("Delete this musing from the draft list?")) {
      return;
    }

    const nextMusings = musings.filter((musing) => musing.id !== selectedMusing.id);
    setMusings(nextMusings);
    setSelectedId(nextMusings[0]?.id || "");
    setStatus("Musing deleted from draft list. Save to publish the deletion.");
  }

  async function saveMusings() {
    try {
      setIsSaving(true);
      setStatus("Saving musings...");
      const response = await fetch("/api/musings", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ musings })
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Save failed.");
      }

      setStatus(
        result.mode === "local"
          ? result.message
          : `Saved to GitHub. Vercel should redeploy from commit ${String(result.commitSha || "").slice(0, 7)}.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save musings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-terminal-black px-4 py-8 font-mono uppercase text-terminal-paper">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 border-b border-terminal-paper/80 pb-4">
          <p className="text-terminal-green">*** MICRONET 800 SERVICES ***</p>
          <h1 className="mt-3 text-4xl text-terminal-yellow">Musings editor</h1>
          <p className="mt-3 max-w-3xl normal-case leading-7 text-terminal-paper/85">
            Edit the short homepage lines without touching Markdown. Saves use GitHub when configured, or local JSON when
            no GitHub token is present.
          </p>
        </div>

        {!isUnlocked ? (
          <form className="max-w-lg border border-terminal-cyan/60 bg-black p-5" onSubmit={unlockEditor}>
            <label className="grid gap-2 text-terminal-cyan">
              Password
              <input
                className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 text-terminal-paper outline-none focus:border-terminal-yellow"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <button className="mt-4 min-h-12 border border-terminal-yellow bg-terminal-yellow px-5 text-terminal-black" type="submit">
              Unlock editor
            </button>
            <p className="mt-4 text-terminal-green" role="status">
              {status}
            </p>
          </form>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
            <aside className="border border-terminal-cyan/50 bg-black p-4">
              <div className="grid gap-2">
                <button className="border border-terminal-green px-3 py-2 text-terminal-green" onClick={addMusing} type="button">
                  Add musing
                </button>
                <button className="border border-terminal-cyan px-3 py-2 text-terminal-cyan" onClick={duplicateMusing} type="button">
                  Duplicate
                </button>
                <button className="border border-terminal-red px-3 py-2 text-terminal-red" onClick={deleteMusing} type="button">
                  Delete
                </button>
                <button
                  className="border border-terminal-yellow bg-terminal-yellow px-3 py-2 text-terminal-black disabled:opacity-60"
                  disabled={isSaving}
                  onClick={saveMusings}
                  type="button"
                >
                  Save
                </button>
              </div>

              <div className="mt-5 grid gap-2">
                {musings.map((musing) => (
                  <button
                    className={`border px-3 py-2 text-left text-sm ${
                      musing.id === selectedMusing?.id
                        ? "border-terminal-yellow text-terminal-yellow"
                        : "border-terminal-cyan/40 text-terminal-paper"
                    }`}
                    key={musing.id}
                    onClick={() => setSelectedId(musing.id)}
                    type="button"
                  >
                    {musing.title}
                  </button>
                ))}
              </div>
            </aside>

            {selectedMusing ? (
              <section className="border border-terminal-cyan/50 bg-black p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-terminal-cyan">
                    Id
                    <input
                      className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 text-terminal-paper outline-none focus:border-terminal-yellow"
                      onBlur={() => updateSelectedMusing("id", slugify(selectedMusing.id))}
                      onChange={(event) => updateSelectedMusing("id", event.target.value)}
                      value={selectedMusing.id}
                    />
                  </label>
                  <label className="grid gap-2 text-terminal-cyan">
                    Date
                    <input
                      className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 text-terminal-paper outline-none focus:border-terminal-yellow"
                      onChange={(event) => updateSelectedMusing("date", event.target.value)}
                      type="date"
                      value={selectedMusing.date}
                    />
                  </label>
                  <label className="grid gap-2 text-terminal-cyan">
                    Category
                    <input
                      className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 text-terminal-paper outline-none focus:border-terminal-yellow"
                      onChange={(event) => updateSelectedMusing("category", event.target.value)}
                      value={selectedMusing.category}
                    />
                  </label>
                  <label className="grid gap-2 text-terminal-cyan">
                    Link
                    <input
                      className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 text-terminal-paper outline-none focus:border-terminal-yellow"
                      onChange={(event) => updateSelectedMusing("href", event.target.value)}
                      placeholder="/writing/example"
                      value={selectedMusing.href}
                    />
                  </label>
                </div>

                <label className="mt-4 grid gap-2 text-terminal-cyan">
                  Title
                  <input
                    className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 text-terminal-paper outline-none focus:border-terminal-yellow"
                    onBlur={() => {
                      if (!selectedMusing.id || selectedMusing.id.startsWith("musing-")) {
                        updateSelectedMusing("id", slugify(selectedMusing.title));
                      }
                    }}
                    onChange={(event) => updateSelectedMusing("title", event.target.value)}
                    value={selectedMusing.title}
                  />
                </label>

                <label className="mt-4 grid gap-2 text-terminal-cyan">
                  Short musing
                  <textarea
                    className="min-h-40 border border-terminal-cyan/60 bg-terminal-black px-4 py-3 normal-case text-terminal-paper outline-none focus:border-terminal-yellow"
                    onChange={(event) => updateSelectedMusing("body", event.target.value)}
                    value={selectedMusing.body}
                  />
                </label>

                <p className="mt-5 text-terminal-green" role="status">
                  {status}
                </p>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
