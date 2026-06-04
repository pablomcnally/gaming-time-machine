"use client";

import { useMemo, useState } from "react";
import type { Exhibit, ExhibitStatus } from "../../../../../data/archive";

type EditableValue = string | number | boolean | string[] | Record<string, unknown> | unknown[] | null | undefined;
type EditableItem = {
  title: string;
  body: string;
  [key: string]: EditableValue;
};
type EditableSection = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  items: EditableItem[];
};
type EditableSource = {
  label: string;
  url: string;
  [key: string]: EditableValue;
};
type EditableExhibit = Omit<Exhibit, "sections" | "sources"> & {
  sections: EditableSection[];
  sources: EditableSource[];
};

const statusOptions: { value: ExhibitStatus; label: string }[] = [
  { value: "ai-draft", label: "AI Draft" },
  { value: "human-edited", label: "Human Edited" },
  { value: "verified", label: "Verified" }
];

const fieldSuggestions = [
  "date",
  "platform",
  "signal",
  "artifact",
  "certainty",
  "sourceNote",
  "publicationName",
  "issueDate",
  "coverImage",
  "coverImageAlt",
  "curatorNote",
  "artifactImage",
  "artifactImageAlt",
  "artifactImageCaption",
  "artifactImageCredit",
  "artifactImageType"
];

function cloneExhibit(exhibit: Exhibit): EditableExhibit {
  return JSON.parse(JSON.stringify(exhibit)) as EditableExhibit;
}

function toLines(values: string[]) {
  return values.join("\n");
}

function fromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function titleFromKey(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function validateExhibit(exhibit: EditableExhibit) {
  const errors: string[] = [];

  if (!statusOptions.some((option) => option.value === exhibit.status)) {
    errors.push("Status must be AI Draft, Human Edited, or Verified.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(exhibit.lastEdited)) {
    errors.push("Last edited must use YYYY-MM-DD format.");
  }

  if (!exhibit.museum.period.trim()) {
    errors.push("Museum period is required.");
  }

  if (!exhibit.museum.accession.trim()) {
    errors.push("Museum accession is required.");
  }

  if (!exhibit.museum.dek.trim()) {
    errors.push("Museum subtitle/dek is required.");
  }

  exhibit.sections.forEach((section, sectionIndex) => {
    if (!section.id.trim()) {
      errors.push(`Section ${sectionIndex + 1} needs an ID.`);
    }

    if (!section.title.trim()) {
      errors.push(`Section ${sectionIndex + 1} needs a title.`);
    }

    section.items.forEach((item, itemIndex) => {
      if (!item.title.trim()) {
        errors.push(`${section.title || `Section ${sectionIndex + 1}`} item ${itemIndex + 1} needs a title.`);
      }

      if (!item.body.trim()) {
        errors.push(`${section.title || `Section ${sectionIndex + 1}`} item ${itemIndex + 1} needs body text.`);
      }
    });
  });

  exhibit.sources.forEach((source, index) => {
    if (!source.label.trim()) {
      errors.push(`Source ${index + 1} needs a label.`);
    }

    if (!source.url.trim()) {
      errors.push(`Source ${index + 1} needs a URL.`);
    } else {
      try {
        new URL(source.url);
      } catch {
        errors.push(`Source ${index + 1} has an invalid URL.`);
      }
    }
  });

  return errors;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{children}</label>;
}

function TextInput({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-zinc-950/15 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-red-700"
      />
    </div>
  );
}

function TextArea({
  label,
  onChange,
  rows = 4,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y border border-zinc-950/15 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none transition focus:border-red-700"
      />
    </div>
  );
}

function EditableValueField({
  fieldKey,
  onChange,
  onRemove,
  value
}: {
  fieldKey: string;
  onChange: (value: EditableValue) => void;
  onRemove?: () => void;
  value: EditableValue;
}) {
  if (typeof value === "string") {
    const isLong = value.length > 80 || /body|note|description|caption|dek/i.test(fieldKey);

    return (
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <FieldLabel>{titleFromKey(fieldKey)}</FieldLabel>
          {onRemove ? (
            <button type="button" onClick={onRemove} className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-700">
              Remove
            </button>
          ) : null}
        </div>
        {isLong ? (
          <textarea
            value={value}
            rows={3}
            onChange={(event) => onChange(event.target.value)}
            className="w-full resize-y border border-zinc-950/15 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-red-700"
          />
        ) : (
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full border border-zinc-950/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-700"
          />
        )}
      </div>
    );
  }

  if (isStringList(value)) {
    return (
      <TextArea label={`${titleFromKey(fieldKey)} (one per line)`} value={toLines(value)} onChange={(nextValue) => onChange(fromLines(nextValue))} />
    );
  }

  if (typeof value === "number") {
    return <TextInput label={titleFromKey(fieldKey)} value={String(value)} onChange={(nextValue) => onChange(Number(nextValue))} />;
  }

  if (typeof value === "boolean") {
    return (
      <label className="inline-flex items-center gap-3 text-sm text-zinc-700">
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
        {titleFromKey(fieldKey)}
      </label>
    );
  }

  return (
    <div className="grid gap-2">
      <FieldLabel>{titleFromKey(fieldKey)} preserved</FieldLabel>
      <pre className="max-h-48 overflow-auto border border-dashed border-zinc-950/20 bg-[#f3efe4] p-3 text-xs leading-5 text-zinc-600">
        {JSON.stringify(value, null, 2)}
      </pre>
      <p className="text-xs leading-5 text-zinc-500">Complex fields are preserved on save. Edit these in JSON only if needed later.</p>
    </div>
  );
}

export function ExhibitEditor({
  exhibit,
  month,
  year
}: {
  exhibit: Exhibit;
  month: string;
  year: number;
}) {
  const [draft, setDraft] = useState<EditableExhibit>(() => cloneExhibit(exhibit));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const validationErrors = useMemo(() => validateExhibit(draft), [draft]);

  function updateDraft(updater: (current: EditableExhibit) => EditableExhibit) {
    setDraft((current) => updater(cloneExhibit(current as Exhibit)));
    setSaveState("idle");
    setMessage("");
  }

  async function save() {
    const errors = validateExhibit(draft);

    if (errors.length > 0) {
      setSaveState("error");
      setMessage(errors[0]);
      return;
    }

    setSaveState("saving");
    setMessage("Saving exhibit JSON...");

    const response = await fetch(`/curator/api/exhibits/${year}/${month}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(draft)
    });
    const result = (await response.json()) as { ok?: boolean; message?: string };

    if (!response.ok || !result.ok) {
      setSaveState("error");
      setMessage(result.message ?? "Save failed.");
      return;
    }

    setSaveState("saved");
    setMessage(result.message ?? "Saved.");
  }

  return (
    <div className="grid gap-8">
      <section className="border border-black/10 bg-[#fbf8ef] p-5 shadow-exhibit md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-700">Workflow</p>
            <h2 className="mt-3 font-display text-4xl text-zinc-950">Editorial State</h2>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saveState === "saving"}
            className="border border-zinc-950 bg-zinc-950 px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-stone-50 transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {saveState === "saving" ? "Saving" : "Save JSON"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <FieldLabel>Status</FieldLabel>
            <select
              value={draft.status}
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  status: event.target.value as ExhibitStatus
                }))
              }
              className="w-full border border-zinc-950/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-700"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <TextInput
            label="Last edited"
            value={draft.lastEdited}
            onChange={(value) => updateDraft((current) => ({ ...current, lastEdited: value }))}
          />
          <TextArea
            label="Editor notes"
            rows={5}
            value={toLines(draft.editorNotes)}
            onChange={(value) => updateDraft((current) => ({ ...current, editorNotes: fromLines(value) }))}
          />
        </div>

        {validationErrors.length > 0 || message ? (
          <div className={`mt-6 border p-4 text-sm leading-6 ${saveState === "saved" ? "border-emerald-700/30 bg-emerald-50 text-emerald-900" : "border-red-700/20 bg-red-50 text-red-900"}`}>
            {message ? <p>{message}</p> : null}
            {validationErrors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5">
                {validationErrors.slice(0, 5).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="border border-black/10 bg-[#fbf8ef] p-5 shadow-exhibit md:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-700">Museum label</p>
        <h2 className="mt-3 font-display text-4xl text-zinc-950">Exhibit Intro</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TextInput label="Name" value={draft.museum.name} onChange={(value) => updateDraft((current) => ({ ...current, museum: { ...current.museum, name: value } }))} />
          <TextInput label="Period" value={draft.museum.period} onChange={(value) => updateDraft((current) => ({ ...current, museum: { ...current.museum, period: value } }))} />
          <TextInput label="Accession" value={draft.museum.accession} onChange={(value) => updateDraft((current) => ({ ...current, museum: { ...current.museum, accession: value } }))} />
          <TextArea label="Status chips (one per line)" value={toLines(draft.museum.statusChips)} onChange={(value) => updateDraft((current) => ({ ...current, museum: { ...current.museum, statusChips: fromLines(value) } }))} />
          <div className="md:col-span-2">
            <TextArea label="Dek" rows={5} value={draft.museum.dek} onChange={(value) => updateDraft((current) => ({ ...current, museum: { ...current.museum, dek: value } }))} />
          </div>
          <div className="md:col-span-2">
            <TextArea label="Curator note" rows={5} value={draft.museum.curatorNote} onChange={(value) => updateDraft((current) => ({ ...current, museum: { ...current.museum, curatorNote: value } }))} />
          </div>
        </div>
      </section>

      {draft.sections.map((section, sectionIndex) => (
        <section key={`${section.id}-${sectionIndex}`} className="border border-black/10 bg-[#fbf8ef] p-5 shadow-exhibit md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-700">{section.eyebrow || `Section ${sectionIndex + 1}`}</p>
              <h2 className="mt-3 font-display text-4xl text-zinc-950">{section.title || "Untitled section"}</h2>
            </div>
            <button
              type="button"
              onClick={() =>
                updateDraft((current) => ({
                  ...current,
                  sections: current.sections.filter((_, index) => index !== sectionIndex)
                }))
              }
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-red-700"
            >
              Remove section
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(["id", "eyebrow", "title", "subtitle"] as const).map((field) => (
              <TextInput
                key={field}
                label={titleFromKey(field)}
                value={section[field]}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    sections: current.sections.map((candidate, index) => (index === sectionIndex ? { ...candidate, [field]: value } : candidate))
                  }))
                }
              />
            ))}
          </div>

          <div className="mt-7 grid gap-5">
            {section.items.map((item, itemIndex) => {
              const extraKeys = Object.keys(item).filter((key) => key !== "title" && key !== "body");

              return (
                <article key={`${item.title}-${itemIndex}`} className="border border-zinc-950/10 bg-[#f3efe4] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                      Item {String(itemIndex + 1).padStart(2, "0")}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((current) => ({
                          ...current,
                          sections: current.sections.map((candidate, index) =>
                            index === sectionIndex
                              ? { ...candidate, items: candidate.items.filter((_, candidateItemIndex) => candidateItemIndex !== itemIndex) }
                              : candidate
                          )
                        }))
                      }
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-700"
                    >
                      Remove item
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <TextInput
                      label="Title"
                      value={item.title}
                      onChange={(value) =>
                        updateDraft((current) => ({
                          ...current,
                          sections: current.sections.map((candidate, index) =>
                            index === sectionIndex
                              ? {
                                  ...candidate,
                                  items: candidate.items.map((candidateItem, candidateItemIndex) =>
                                    candidateItemIndex === itemIndex ? { ...candidateItem, title: value } : candidateItem
                                  )
                                }
                              : candidate
                          )
                        }))
                      }
                    />
                    <TextArea
                      label="Body"
                      rows={5}
                      value={item.body}
                      onChange={(value) =>
                        updateDraft((current) => ({
                          ...current,
                          sections: current.sections.map((candidate, index) =>
                            index === sectionIndex
                              ? {
                                  ...candidate,
                                  items: candidate.items.map((candidateItem, candidateItemIndex) =>
                                    candidateItemIndex === itemIndex ? { ...candidateItem, body: value } : candidateItem
                                  )
                                }
                              : candidate
                          )
                        }))
                      }
                    />

                    {extraKeys.map((fieldKey) => (
                      <EditableValueField
                        key={fieldKey}
                        fieldKey={fieldKey}
                        value={item[fieldKey]}
                        onChange={(value) =>
                          updateDraft((current) => ({
                            ...current,
                            sections: current.sections.map((candidate, index) =>
                              index === sectionIndex
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((candidateItem, candidateItemIndex) =>
                                      candidateItemIndex === itemIndex ? { ...candidateItem, [fieldKey]: value } : candidateItem
                                    )
                                  }
                                : candidate
                            )
                          }))
                        }
                        onRemove={() =>
                          updateDraft((current) => ({
                            ...current,
                            sections: current.sections.map((candidate, index) => {
                              if (index !== sectionIndex) {
                                return candidate;
                              }

                              return {
                                ...candidate,
                                items: candidate.items.map((candidateItem, candidateItemIndex) => {
                                  if (candidateItemIndex !== itemIndex) {
                                    return candidateItem;
                                  }

                                  const nextItem = { ...candidateItem };
                                  delete nextItem[fieldKey];
                                  return nextItem;
                                })
                              };
                            })
                          }))
                        }
                      />
                    ))}

                    <div className="flex flex-wrap gap-2">
                      {fieldSuggestions
                        .filter((field) => !(field in item))
                        .slice(0, 8)
                        .map((field) => (
                          <button
                            key={field}
                            type="button"
                            onClick={() =>
                              updateDraft((current) => ({
                                ...current,
                                sections: current.sections.map((candidate, index) =>
                                  index === sectionIndex
                                    ? {
                                        ...candidate,
                                        items: candidate.items.map((candidateItem, candidateItemIndex) =>
                                          candidateItemIndex === itemIndex ? { ...candidateItem, [field]: "" } : candidateItem
                                        )
                                      }
                                    : candidate
                                )
                              }))
                            }
                            className="border border-zinc-950/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600 transition hover:border-red-700 hover:text-red-700"
                          >
                            Add {field}
                          </button>
                        ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              updateDraft((current) => ({
                ...current,
                sections: current.sections.map((candidate, index) =>
                  index === sectionIndex
                    ? { ...candidate, items: [...candidate.items, { title: "New item", body: "Add exhibit text here." }] }
                    : candidate
                )
              }))
            }
            className="mt-5 border border-zinc-950 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-950 transition hover:border-red-700 hover:text-red-700"
          >
            Add item
          </button>
        </section>
      ))}

      <section className="border border-black/10 bg-[#fbf8ef] p-5 shadow-exhibit md:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-700">Reference shelf</p>
        <h2 className="mt-3 font-display text-4xl text-zinc-950">Sources</h2>
        <div className="mt-6 grid gap-4">
          {draft.sources.map((source, sourceIndex) => (
            <article key={`${source.label}-${sourceIndex}`} className="grid gap-4 border border-zinc-950/10 bg-[#f3efe4] p-4 md:grid-cols-[1fr_1fr]">
              <TextInput
                label="Label"
                value={source.label}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    sources: current.sources.map((candidate, index) => (index === sourceIndex ? { ...candidate, label: value } : candidate))
                  }))
                }
              />
              <TextInput
                label="URL"
                value={source.url}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    sources: current.sources.map((candidate, index) => (index === sourceIndex ? { ...candidate, url: value } : candidate))
                  }))
                }
              />
              {Object.keys(source)
                .filter((key) => key !== "label" && key !== "url")
                .map((fieldKey) => (
                  <EditableValueField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    value={source[fieldKey]}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        sources: current.sources.map((candidate, index) => (index === sourceIndex ? { ...candidate, [fieldKey]: value } : candidate))
                      }))
                    }
                  />
                ))}
            </article>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            updateDraft((current) => ({
              ...current,
              sources: [...current.sources, { label: "New source", url: "https://example.com" }]
            }))
          }
          className="mt-5 border border-zinc-950 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-950 transition hover:border-red-700 hover:text-red-700"
        >
          Add source
        </button>
      </section>
    </div>
  );
}
