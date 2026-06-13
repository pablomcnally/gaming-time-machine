"use client";

import { FormEvent, useEffect, useState } from "react";

type ContentBundle = {
  home: any;
  about: any;
  contact: any;
  career: any[];
  archive: any[];
  musings: any[];
};

type MediaLibrary = {
  images: string[];
  mode?: "github" | "local";
};

type TabId = "home" | "about" | "career" | "archive" | "contact" | "musings";

const tabs: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "career", label: "Career" },
  { id: "archive", label: "Archive" },
  { id: "contact", label: "Contact" },
  { id: "musings", label: "Musings" }
];

const emptyContent: ContentBundle = {
  home: {
    taglineParts: [],
    introLines: [],
    status: {},
    storyStats: []
  },
  about: {
    panels: []
  },
  contact: {
    links: []
  },
  career: [],
  archive: [],
  musings: []
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function linesToText(lines: string[]) {
  return (lines || []).join("\n");
}

function textToLines(value: string) {
  return value.split("\n");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Could not read the selected image.")));
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-terminal-cyan">
      {label}
      <input
        className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 normal-case text-terminal-paper outline-none focus:border-terminal-yellow"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value || ""}
      />
    </label>
  );
}

function TextArea({
  label,
  onChange,
  rows = 5,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-terminal-cyan">
      {label}
      <textarea
        className="border border-terminal-cyan/60 bg-terminal-black px-4 py-3 normal-case text-terminal-paper outline-none focus:border-terminal-yellow"
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value || ""}
      />
    </label>
  );
}

function Panel({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="border border-terminal-cyan/50 bg-black p-5">
      <h2 className="mb-5 border-b border-terminal-cyan/40 pb-3 text-2xl text-terminal-yellow">{title}</h2>
      {children}
    </section>
  );
}

function RowActions({ onDelete, onDuplicate }: { onDelete: () => void; onDuplicate: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className="border border-terminal-cyan px-3 py-2 text-terminal-cyan" onClick={onDuplicate} type="button">
        Duplicate
      </button>
      <button className="border border-terminal-red px-3 py-2 text-terminal-red" onClick={onDelete} type="button">
        Delete
      </button>
    </div>
  );
}

export default function EditorPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [content, setContent] = useState<ContentBundle>(emptyContent);
  const [media, setMedia] = useState<MediaLibrary>({ images: [] });
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [status, setStatus] = useState("Enter the editor password to load site content.");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingArchiveIndex, setUploadingArchiveIndex] = useState<number | null>(null);

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

  async function loadContent(nextPassword = password) {
    setStatus("Loading editable content...");
    const response = await fetch("/api/content", {
      headers: getHeaders(nextPassword)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Could not load content.");
    }

    setContent(result.content);
    setIsUnlocked(true);
    setStatus(result.mode === "local" ? "Loaded from local JSON." : "Loaded from GitHub.");
    await loadMedia(nextPassword);
  }

  async function loadMedia(nextPassword = password) {
    const response = await fetch("/api/media", {
      headers: getHeaders(nextPassword)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Could not load archive images.");
    }

    setMedia({
      images: result.images || [],
      mode: result.mode
    });
  }

  async function unlockEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.sessionStorage.setItem("paulArchiveEditorPassword", password);

    try {
      await loadContent(password);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not unlock editor.");
    }
  }

  function updateSection(section: keyof ContentBundle, nextValue: any) {
    setContent((current) => ({ ...current, [section]: nextValue }));
  }

  function updateHome(path: string, value: any) {
    setContent((current) => {
      if (path.startsWith("status.")) {
        const key = path.replace("status.", "");

        return {
          ...current,
          home: {
            ...current.home,
            status: {
              ...current.home.status,
              [key]: value
            }
          }
        };
      }

      return {
        ...current,
        home: {
          ...current.home,
          [path]: value
        }
      };
    });
  }

  function updateArrayItem(section: "career" | "archive" | "musings", index: number, field: string, value: any) {
    setContent((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  function addArrayItem(section: "career" | "archive" | "musings", item: any) {
    setContent((current) => ({
      ...current,
      [section]: [item, ...current[section]]
    }));
  }

  function duplicateArrayItem(section: "career" | "archive" | "musings", index: number) {
    setContent((current) => {
      const copy = { ...current[section][index] };

      if ("id" in copy) {
        copy.id = `${copy.id}-copy`;
      }

      const nextList = current[section].slice();
      nextList.splice(index + 1, 0, copy);

      return { ...current, [section]: nextList };
    });
  }

  function deleteArrayItem(section: "career" | "archive" | "musings", index: number) {
    if (!window.confirm("Delete this item from the draft list?")) {
      return;
    }

    setContent((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function saveContent() {
    try {
      setIsSaving(true);
      setStatus("Saving content...");
      const response = await fetch("/api/content", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ content })
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Save failed.");
      }

      setStatus(
        result.mode === "local"
          ? result.message
          : result.changedFiles > 0
            ? `Saved to GitHub. ${result.changedFiles} content file(s) updated. Vercel should redeploy shortly.`
            : "No content changes to save."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save content.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadArchiveImage(index: number, file: File) {
    try {
      setUploadingArchiveIndex(index);
      setStatus(`Uploading ${file.name}...`);
      const dataUrl = await readFileAsDataUrl(file);
      const response = await fetch("/api/media", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          fileName: file.name,
          dataUrl
        })
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Image upload failed.");
      }

      updateArrayItem("archive", index, "image", result.imagePath);
      setMedia((current) => ({
        ...current,
        images: Array.from(new Set([result.imagePath, ...current.images])).sort()
      }));
      setStatus(`Uploaded ${result.imagePath}. Save all to attach it to this archive card.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not upload image.");
    } finally {
      setUploadingArchiveIndex(null);
    }
  }

  return (
    <main className="min-h-screen bg-terminal-black px-4 py-8 font-mono uppercase text-terminal-paper">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 border-b border-terminal-paper/80 pb-4">
          <p className="text-terminal-green">*** MICRONET 800 SERVICES ***</p>
          <h1 className="mt-3 text-4xl text-terminal-yellow">Site editor</h1>
          <p className="mt-3 max-w-3xl normal-case leading-7 text-terminal-paper/85">
            Edit page content without touching the code. The Viewdata layout stays protected; these fields update the JSON
            files that feed the site.
          </p>
        </div>

        {!isUnlocked ? (
          <form className="max-w-lg border border-terminal-cyan/60 bg-black p-5" onSubmit={unlockEditor}>
            <Field label="Password" onChange={setPassword} type="password" value={password} />
            <button className="mt-4 min-h-12 border border-terminal-yellow bg-terminal-yellow px-5 text-terminal-black" type="submit">
              Unlock editor
            </button>
            <p className="mt-4 text-terminal-green" role="status">
              {status}
            </p>
          </form>
        ) : (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-terminal-cyan/50 bg-black p-3">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    className={`border px-3 py-2 ${activeTab === tab.id ? "border-terminal-yellow text-terminal-yellow" : "border-terminal-cyan/50 text-terminal-cyan"}`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                className="border border-terminal-yellow bg-terminal-yellow px-5 py-2 text-terminal-black disabled:opacity-60"
                disabled={isSaving}
                onClick={saveContent}
                type="button"
              >
                Save all
              </button>
            </div>

            {activeTab === "home" ? <HomeEditor content={content} updateHome={updateHome} updateSection={updateSection} /> : null}
            {activeTab === "about" ? <AboutEditor content={content} updateSection={updateSection} /> : null}
            {activeTab === "career" ? (
              <CareerEditor addArrayItem={addArrayItem} content={content} deleteArrayItem={deleteArrayItem} duplicateArrayItem={duplicateArrayItem} updateArrayItem={updateArrayItem} />
            ) : null}
            {activeTab === "archive" ? (
              <ArchiveEditor
                addArrayItem={addArrayItem}
                content={content}
                deleteArrayItem={deleteArrayItem}
                duplicateArrayItem={duplicateArrayItem}
                media={media}
                onUploadImage={uploadArchiveImage}
                updateArrayItem={updateArrayItem}
                uploadingArchiveIndex={uploadingArchiveIndex}
              />
            ) : null}
            {activeTab === "contact" ? <ContactEditor content={content} updateSection={updateSection} /> : null}
            {activeTab === "musings" ? (
              <MusingsEditor addArrayItem={addArrayItem} content={content} deleteArrayItem={deleteArrayItem} duplicateArrayItem={duplicateArrayItem} updateArrayItem={updateArrayItem} />
            ) : null}

            <p className="border border-terminal-green/50 bg-black p-4 text-terminal-green" role="status">
              {status}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function HomeEditor({
  content,
  updateHome,
  updateSection
}: {
  content: ContentBundle;
  updateHome: (path: string, value: any) => void;
  updateSection: (section: keyof ContentBundle, nextValue: any) => void;
}) {
  const home = content.home;

  return (
    <Panel title="Home page">
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea label="Tagline parts (one per line)" onChange={(value) => updateHome("taglineParts", textToLines(value))} value={linesToText(home.taglineParts)} />
        <TextArea label="Intro lines (one per line)" onChange={(value) => updateHome("introLines", textToLines(value))} value={linesToText(home.introLines)} />
        <Field label="Welcome title" onChange={(value) => updateHome("welcomeTitle", value)} value={home.welcomeTitle} />
        <Field label="Read more label" onChange={(value) => updateHome("readMoreLabel", value)} value={home.readMoreLabel} />
        <Field label="Latest title" onChange={(value) => updateHome("latestTitle", value)} value={home.latestTitle} />
        <Field label="Latest counter" onChange={(value) => updateHome("latestCounter", value)} value={home.latestCounter} />
        <Field label="Latest CTA label" onChange={(value) => updateHome("latestCtaLabel", value)} value={home.latestCtaLabel} />
        <Field label="Selected work title" onChange={(value) => updateHome("selectedWorkTitle", value)} value={home.selectedWorkTitle} />
        <Field label="Selected work counter" onChange={(value) => updateHome("selectedWorkCounter", value)} value={home.selectedWorkCounter} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {["title", "state", "user", "location", "service"].map((field) => (
          <Field key={field} label={`Status ${field}`} onChange={(value) => updateHome(`status.${field}`, value)} value={home.status?.[field]} />
        ))}
      </div>

      <EditableList
        addLabel="Add stat"
        items={home.storyStats || []}
        onAdd={() => updateHome("storyStats", [{ label: "New stat", value: "Value" }, ...(home.storyStats || [])])}
        onDelete={(index) => updateHome("storyStats", home.storyStats.filter((_: any, itemIndex: number) => itemIndex !== index))}
        onDuplicate={(index) => {
          const nextStats = home.storyStats.slice();
          nextStats.splice(index + 1, 0, { ...home.storyStats[index] });
          updateHome("storyStats", nextStats);
        }}
        renderItem={(item, index) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label" onChange={(value) => updateHome("storyStats", home.storyStats.map((stat: any, itemIndex: number) => (itemIndex === index ? { ...stat, label: value } : stat)))} value={item.label} />
            <Field label="Value" onChange={(value) => updateHome("storyStats", home.storyStats.map((stat: any, itemIndex: number) => (itemIndex === index ? { ...stat, value } : stat)))} value={item.value} />
          </div>
        )}
        title="Story so far stats"
      />
    </Panel>
  );
}

function AboutEditor({ content, updateSection }: { content: ContentBundle; updateSection: (section: keyof ContentBundle, nextValue: any) => void }) {
  const about = content.about;

  function updateAbout(next: any) {
    updateSection("about", { ...about, ...next });
  }

  return (
    <Panel title="About page">
      <div className="grid gap-4">
        <Field label="Eyebrow" onChange={(value) => updateAbout({ eyebrow: value })} value={about.eyebrow} />
        <Field label="Title" onChange={(value) => updateAbout({ title: value })} value={about.title} />
        <TextArea label="Intro" onChange={(value) => updateAbout({ intro: value })} value={about.intro} />
      </div>

      <EditableList
        addLabel="Add panel"
        items={about.panels || []}
        onAdd={() => updateAbout({ panels: [{ title: "NEW PANEL", tone: "cyan", paragraphs: ["Panel text."] }, ...(about.panels || [])] })}
        onDelete={(index) => updateAbout({ panels: about.panels.filter((_: any, itemIndex: number) => itemIndex !== index) })}
        onDuplicate={(index) => {
          const nextPanels = about.panels.slice();
          nextPanels.splice(index + 1, 0, { ...about.panels[index], paragraphs: [...about.panels[index].paragraphs] });
          updateAbout({ panels: nextPanels });
        }}
        renderItem={(panel, index) => (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Panel title" onChange={(value) => updateAbout({ panels: about.panels.map((item: any, itemIndex: number) => (itemIndex === index ? { ...item, title: value } : item)) })} value={panel.title} />
              <label className="grid gap-2 text-terminal-cyan">
                Tone
                <select
                  className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 text-terminal-paper"
                  onChange={(event) => updateAbout({ panels: about.panels.map((item: any, itemIndex: number) => (itemIndex === index ? { ...item, tone: event.target.value } : item)) })}
                  value={panel.tone}
                >
                  <option value="cyan">Cyan</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                </select>
              </label>
            </div>
            <TextArea
              label="Paragraphs (blank lines are ignored)"
              onChange={(value) => updateAbout({ panels: about.panels.map((item: any, itemIndex: number) => (itemIndex === index ? { ...item, paragraphs: textToLines(value) } : item)) })}
              rows={7}
              value={linesToText(panel.paragraphs)}
            />
          </div>
        )}
        title="About panels"
      />
    </Panel>
  );
}

function ContactEditor({ content, updateSection }: { content: ContentBundle; updateSection: (section: keyof ContentBundle, nextValue: any) => void }) {
  const contact = content.contact;
  const updateContact = (next: any) => updateSection("contact", { ...contact, ...next });

  return (
    <Panel title="Contact page">
      <div className="grid gap-4">
        <Field label="Eyebrow" onChange={(value) => updateContact({ eyebrow: value })} value={contact.eyebrow} />
        <Field label="Title" onChange={(value) => updateContact({ title: value })} value={contact.title} />
        <TextArea label="Intro" onChange={(value) => updateContact({ intro: value })} value={contact.intro} />
        <Field label="Panel title" onChange={(value) => updateContact({ panelTitle: value })} value={contact.panelTitle} />
        <TextArea label="Panel body" onChange={(value) => updateContact({ panelBody: value })} value={contact.panelBody} />
        <Field label="Contact form action" onChange={(value) => updateContact({ formAction: value })} value={contact.formAction} />
      </div>

      <EditableList
        addLabel="Add link"
        items={contact.links || []}
        onAdd={() => updateContact({ links: [{ label: "New link", href: "https://" }, ...(contact.links || [])] })}
        onDelete={(index) => updateContact({ links: contact.links.filter((_: any, itemIndex: number) => itemIndex !== index) })}
        onDuplicate={(index) => {
          const nextLinks = contact.links.slice();
          nextLinks.splice(index + 1, 0, { ...contact.links[index] });
          updateContact({ links: nextLinks });
        }}
        renderItem={(link, index) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label" onChange={(value) => updateContact({ links: contact.links.map((item: any, itemIndex: number) => (itemIndex === index ? { ...item, label: value } : item)) })} value={link.label} />
            <Field label="Href" onChange={(value) => updateContact({ links: contact.links.map((item: any, itemIndex: number) => (itemIndex === index ? { ...item, href: value } : item)) })} value={link.href} />
          </div>
        )}
        title="Contact links"
      />
    </Panel>
  );
}

function CareerEditor({ addArrayItem, content, deleteArrayItem, duplicateArrayItem, updateArrayItem }: any) {
  return (
    <Panel title="Career timeline">
      <button
        className="mb-5 border border-terminal-green px-4 py-2 text-terminal-green"
        onClick={() => addArrayItem("career", { year: "2026", range: "2026", role: "New role", company: "Company", description: "Description.", image: "/archive/press-terminal.svg", link: "" })}
        type="button"
      >
        Add career entry
      </button>
      <div className="grid gap-5">
        {content.career.map((entry: any, index: number) => (
          <article className="border border-terminal-cyan/40 p-4" key={`${entry.year}-${index}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-terminal-yellow">{entry.year || "Career entry"}</h3>
              <RowActions onDelete={() => deleteArrayItem("career", index)} onDuplicate={() => duplicateArrayItem("career", index)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {["year", "range", "role", "company", "image", "link"].map((field) => (
                <Field key={field} label={field} onChange={(value) => updateArrayItem("career", index, field, value)} value={entry[field] || ""} />
              ))}
            </div>
            <div className="mt-4">
              <TextArea label="Description" onChange={(value) => updateArrayItem("career", index, "description", value)} value={entry.description || ""} />
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ArchiveEditor({
  addArrayItem,
  content,
  deleteArrayItem,
  duplicateArrayItem,
  media,
  onUploadImage,
  updateArrayItem,
  uploadingArchiveIndex
}: any) {
  return (
    <Panel title="Archive cards">
      <button
        className="mb-5 border border-terminal-green px-4 py-2 text-terminal-green"
        onClick={() => addArrayItem("archive", { image: "/archive/viewdata-cards.svg", title: "New archive item", caption: "Caption.", year: "2026", category: "press", publication: "Publication", externalLink: "" })}
        type="button"
      >
        Add archive item
      </button>
      <div className="grid gap-5">
        {content.archive.map((item: any, index: number) => (
          <article className="border border-terminal-cyan/40 p-4" key={`${item.title}-${index}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-terminal-yellow">{item.title || "Archive item"}</h3>
              <RowActions onDelete={() => deleteArrayItem("archive", index)} onDuplicate={() => duplicateArrayItem("archive", index)} />
            </div>
            <ArchiveImagePicker
              image={item.image || ""}
              images={media.images || []}
              isUploading={uploadingArchiveIndex === index}
              onChange={(value) => updateArrayItem("archive", index, "image", value)}
              onUpload={(file) => onUploadImage(index, file)}
            />
            <div className="grid gap-4 md:grid-cols-2">
              {["title", "year", "publication", "externalLink"].map((field) => (
                <Field key={field} label={field} onChange={(value) => updateArrayItem("archive", index, field, value)} value={item[field] || ""} />
              ))}
              <label className="grid gap-2 text-terminal-cyan">
                Category
                <select
                  className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 text-terminal-paper"
                  onChange={(event) => updateArrayItem("archive", index, "category", event.target.value)}
                  value={item.category || "press"}
                >
                  <option value="magazines">Magazines</option>
                  <option value="websites">Websites</option>
                  <option value="events">Events</option>
                  <option value="press">Press</option>
                  <option value="retro">Retro</option>
                </select>
              </label>
            </div>
            <div className="mt-4">
              <TextArea label="Caption" onChange={(value) => updateArrayItem("archive", index, "caption", value)} value={item.caption || ""} />
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ArchiveImagePicker({
  image,
  images,
  isUploading,
  onChange,
  onUpload
}: {
  image: string;
  images: string[];
  isUploading: boolean;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
}) {
  const selectedImage = image || images[0] || "";

  return (
    <div className="mb-5 grid gap-4 border border-terminal-cyan/35 bg-terminal-black/80 p-4 md:grid-cols-[14rem_1fr]">
      <div className="border border-terminal-paper/50 bg-black">
        {selectedImage ? (
          <img alt="" className="aspect-[4/3] w-full object-cover" src={selectedImage} />
        ) : (
          <div className="grid aspect-[4/3] place-items-center p-4 text-center text-sm text-terminal-paper/70">No image selected</div>
        )}
      </div>
      <div className="grid gap-4">
        <label className="grid gap-2 text-terminal-cyan">
          Choose archive image
          <select
            className="min-h-12 border border-terminal-cyan/60 bg-terminal-black px-4 normal-case text-terminal-paper"
            onChange={(event) => onChange(event.target.value)}
            value={image || ""}
          >
            <option value="">Choose an existing image...</option>
            {images.map((imagePath) => (
              <option key={imagePath} value={imagePath}>
                {imagePath}
              </option>
            ))}
          </select>
        </label>

        <Field label="Image path" onChange={onChange} placeholder="/archive/uploads/example.png" value={image || ""} />

        <label className="grid gap-2 text-terminal-cyan">
          Upload new image
          <input
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="border border-terminal-cyan/60 bg-terminal-black px-4 py-3 normal-case text-terminal-paper file:mr-4 file:border-0 file:bg-terminal-yellow file:px-4 file:py-2 file:font-mono file:uppercase file:text-terminal-black"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                onUpload(file);
              }

              event.target.value = "";
            }}
            type="file"
          />
        </label>

        <p className="normal-case leading-6 text-terminal-paper/75">
          Uploads are saved under /archive/uploads and then selected for this card. Use Save all after uploading to update the archive JSON.
        </p>
        {isUploading ? <p className="text-terminal-green">Uploading image...</p> : null}
      </div>
    </div>
  );
}

function MusingsEditor({ addArrayItem, content, deleteArrayItem, duplicateArrayItem, updateArrayItem }: any) {
  return (
    <Panel title="Homepage musings">
      <button
        className="mb-5 border border-terminal-green px-4 py-2 text-terminal-green"
        onClick={() => addArrayItem("musings", { id: `musing-${Date.now().toString().slice(-8)}`, title: "New short musing", date: new Date().toISOString().slice(0, 10), category: "Musing", body: "A short thought.", href: "" })}
        type="button"
      >
        Add musing
      </button>
      <div className="grid gap-5">
        {content.musings.map((musing: any, index: number) => (
          <article className="border border-terminal-cyan/40 p-4" key={`${musing.id}-${index}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-terminal-yellow">{musing.title || "Musing"}</h3>
              <RowActions onDelete={() => deleteArrayItem("musings", index)} onDuplicate={() => duplicateArrayItem("musings", index)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Id" onChange={(value) => updateArrayItem("musings", index, "id", slugify(value))} value={musing.id || ""} />
              <Field label="Date" onChange={(value) => updateArrayItem("musings", index, "date", value)} type="date" value={musing.date || ""} />
              <Field label="Title" onChange={(value) => updateArrayItem("musings", index, "title", value)} value={musing.title || ""} />
              <Field label="Category" onChange={(value) => updateArrayItem("musings", index, "category", value)} value={musing.category || ""} />
              <Field label="Link" onChange={(value) => updateArrayItem("musings", index, "href", value)} value={musing.href || ""} />
            </div>
            <div className="mt-4">
              <TextArea label="Short musing" onChange={(value) => updateArrayItem("musings", index, "body", value)} value={musing.body || ""} />
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function EditableList({
  addLabel,
  items,
  onAdd,
  onDelete,
  onDuplicate,
  renderItem,
  title
}: {
  addLabel: string;
  items: any[];
  onAdd: () => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  renderItem: (item: any, index: number) => React.ReactNode;
  title: string;
}) {
  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl text-terminal-yellow">{title}</h3>
        <button className="border border-terminal-green px-3 py-2 text-terminal-green" onClick={onAdd} type="button">
          {addLabel}
        </button>
      </div>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <article className="border border-terminal-cyan/40 p-4" key={index}>
            <div className="mb-4 flex justify-end">
              <RowActions onDelete={() => onDelete(index)} onDuplicate={() => onDuplicate(index)} />
            </div>
            {renderItem(item, index)}
          </article>
        ))}
      </div>
    </div>
  );
}
