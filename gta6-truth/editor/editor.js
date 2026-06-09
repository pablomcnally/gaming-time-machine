const loginPanel = document.querySelector("#loginPanel");
const loginForm = document.querySelector("#loginForm");
const passwordInput = document.querySelector("#passwordInput");
const editorApp = document.querySelector("#editorApp");
const storyList = document.querySelector("#storyList");
const storyForm = document.querySelector("#storyForm");
const statusText = document.querySelector("#statusText");
const loginStatusText = document.querySelector("#loginStatusText");
const addStoryButton = document.querySelector("#addStoryButton");
const makeLeadButton = document.querySelector("#makeLeadButton");
const duplicateStoryButton = document.querySelector("#duplicateStoryButton");
const deleteStoryButton = document.querySelector("#deleteStoryButton");
const saveButton = document.querySelector("#saveButton");

const categoryLabels = {
  leak: "Leak",
  analysis: "Analysis",
  local: "Local chaos"
};

let password = window.sessionStorage.getItem("gtaTruthEditorPassword") || "";
let data = null;
let selectedIndex = 0;

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "var(--red)" : "var(--ink)";
}

function setLoginStatus(message, isError = false) {
  loginStatusText.textContent = message;
  loginStatusText.style.color = isError ? "var(--red)" : "var(--ink)";
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-editor-password": password
  };
}

async function requestStories() {
  const response = await fetch("/api/stories", {
    headers: getHeaders()
  });
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Could not load stories.");
  }

  return result.data;
}

function selectedStory() {
  return data.stories[selectedIndex];
}

function storyFromForm() {
  const formData = new FormData(storyForm);
  return {
    slug: formData.get("slug").trim(),
    category: formData.get("category"),
    categoryLabel: formData.get("categoryLabel").trim(),
    badge: formData.get("badge").trim(),
    accent: formData.get("accent"),
    title: formData.get("title").trim(),
    description: formData.get("description").trim(),
    author: formData.get("author").trim(),
    readTime: formData.get("readTime").trim(),
    date: formData.get("date").trim(),
    body: formData
      .get("body")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  };
}

function syncCurrentStory() {
  if (!data || !data.stories[selectedIndex]) return;
  data.stories[selectedIndex] = storyFromForm();
  data.updatedLabel = storyForm.elements.updatedLabel.value.trim();
  data.lead.label = storyForm.elements.leadLabel.value.trim();
  data.lead.title = storyForm.elements.leadTitle.value.trim();
  data.lead.summary = storyForm.elements.leadSummary.value.trim();
  data.ticker = storyForm.elements.ticker.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function fillForm() {
  const story = selectedStory();
  storyForm.elements.slug.value = story.slug;
  storyForm.elements.category.value = story.category;
  storyForm.elements.categoryLabel.value = story.categoryLabel;
  storyForm.elements.badge.value = story.badge;
  storyForm.elements.accent.value = story.accent;
  storyForm.elements.author.value = story.author;
  storyForm.elements.readTime.value = story.readTime;
  storyForm.elements.date.value = story.date;
  storyForm.elements.title.value = story.title;
  storyForm.elements.description.value = story.description;
  storyForm.elements.body.value = story.body.join("\n\n");
  storyForm.elements.updatedLabel.value = data.updatedLabel;
  storyForm.elements.leadLabel.value = data.lead.label;
  storyForm.elements.leadTitle.value = data.lead.title;
  storyForm.elements.leadSummary.value = data.lead.summary;
  storyForm.elements.ticker.value = data.ticker.join("\n");
}

function renderStoryList() {
  storyList.innerHTML = "";
  data.stories.forEach((story, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = story.title || "Untitled story";
    button.classList.toggle("active", index === selectedIndex);
    button.addEventListener("click", () => {
      syncCurrentStory();
      selectedIndex = index;
      renderStoryList();
      fillForm();
    });
    storyList.append(button);
  });
}

function validateData() {
  syncCurrentStory();

  if (!data.updatedLabel || !data.lead.label || !data.lead.title || !data.lead.summary) {
    throw new Error("Homepage settings are missing required text.");
  }

  if (!data.ticker.length) {
    throw new Error("Add at least one ticker line.");
  }

  const slugs = new Set();
  data.stories.forEach((story, index) => {
    const number = index + 1;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(story.slug)) {
      throw new Error(`Story ${number} has an invalid slug.`);
    }
    if (slugs.has(story.slug)) {
      throw new Error(`Duplicate slug: ${story.slug}`);
    }
    slugs.add(story.slug);
    for (const field of ["category", "categoryLabel", "badge", "accent", "title", "description", "author", "readTime", "date"]) {
      if (!story[field]) throw new Error(`Story ${number} is missing ${field}.`);
    }
    if (!story.body.length) {
      throw new Error(`Story ${number} needs at least one body paragraph.`);
    }
  });
}

async function loadEditor() {
  setStatus("Loading stories...");
  data = await requestStories();
  selectedIndex = 0;
  loginPanel.classList.add("hidden");
  editorApp.classList.remove("hidden");
  renderStoryList();
  fillForm();
  setStatus("Stories loaded.");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  password = passwordInput.value;
  window.sessionStorage.setItem("gtaTruthEditorPassword", password);
  setLoginStatus("Checking password...");

  try {
    await loadEditor();
    setLoginStatus("");
  } catch (error) {
    passwordInput.focus();
    setLoginStatus(error.message, true);
  }
});

addStoryButton.addEventListener("click", () => {
  syncCurrentStory();
  const slug = `new-story-${Date.now().toString().slice(-6)}`;
  data.stories.unshift({
    slug,
    category: "leak",
    categoryLabel: "Leak",
    badge: "Unverified",
    accent: "blue",
    title: "New story headline.",
    description: "Short homepage and search preview description.",
    author: "Writer Name",
    readTime: "3 min read",
    date: data.updatedLabel,
    body: ["First paragraph.", "Second paragraph."]
  });
  selectedIndex = 0;
  renderStoryList();
  fillForm();
  setStatus("New story added. Edit it, then save.");
});

duplicateStoryButton.addEventListener("click", () => {
  syncCurrentStory();
  const copy = structuredClone(selectedStory());
  copy.slug = `${copy.slug}-copy`;
  copy.title = `${copy.title} Copy`;
  data.stories.splice(selectedIndex + 1, 0, copy);
  selectedIndex += 1;
  renderStoryList();
  fillForm();
  setStatus("Story duplicated. Update the slug before saving.");
});

makeLeadButton.addEventListener("click", () => {
  syncCurrentStory();
  const story = selectedStory();
  data.lead.label = story.categoryLabel || "Front page exclusive";
  data.lead.title = story.title;
  data.lead.summary = story.description;
  storyForm.elements.leadLabel.value = data.lead.label;
  storyForm.elements.leadTitle.value = data.lead.title;
  storyForm.elements.leadSummary.value = data.lead.summary;
  setStatus("Selected story copied into the homepage hero. Save to publish it.");
});

deleteStoryButton.addEventListener("click", () => {
  if (data.stories.length <= 1) {
    setStatus("You need at least one story.", true);
    return;
  }

  if (!window.confirm("Delete this story from the draft?")) return;
  data.stories.splice(selectedIndex, 1);
  selectedIndex = Math.max(0, selectedIndex - 1);
  renderStoryList();
  fillForm();
  setStatus("Story deleted from draft. Save to publish the deletion.");
});

saveButton.addEventListener("click", async () => {
  try {
    validateData();
    setStatus("Saving to GitHub...");
    saveButton.disabled = true;
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ data })
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Save failed.");
    }

    renderStoryList();
    setStatus(`Saved. Vercel should redeploy from commit ${result.commitSha.slice(0, 7)}.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    saveButton.disabled = false;
  }
});

storyForm.elements.category.addEventListener("change", (event) => {
  storyForm.elements.categoryLabel.value = categoryLabels[event.target.value] || event.target.value;
});

storyForm.elements.title.addEventListener("blur", () => {
  if (!storyForm.elements.slug.value || storyForm.elements.slug.value.startsWith("new-story-")) {
    storyForm.elements.slug.value = slugify(storyForm.elements.title.value);
  }
});

if (password) {
  passwordInput.value = password;
  setLoginStatus("Checking saved password...");
  loadEditor().catch((error) => {
    loginPanel.classList.remove("hidden");
    editorApp.classList.add("hidden");
    setLoginStatus(error.message, true);
  });
}
