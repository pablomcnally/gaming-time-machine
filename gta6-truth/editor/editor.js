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
const refreshTipsButton = document.querySelector("#refreshTipsButton");
const tipList = document.querySelector("#tipList");
const imageFileInput = document.querySelector("#imageFileInput");
const uploadImageButton = document.querySelector("#uploadImageButton");

const categoryLabels = {
  leak: "Leak",
  analysis: "Analysis",
  local: "Local chaos"
};

let password = window.sessionStorage.getItem("gtaTruthEditorPassword") || "";
let data = null;
let tips = [];
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(String(reader.result).split(",")[1] || "");
    });
    reader.addEventListener("error", () => reject(new Error("Could not read image file.")));
    reader.readAsDataURL(file);
  });
}

async function requestTips() {
  const response = await fetch("/api/tips", {
    headers: getHeaders()
  });
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Could not load tips.");
  }

  return result.tips;
}

async function saveTips(nextTips) {
  const response = await fetch("/api/tips", {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ tips: nextTips })
  });
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Could not update tips.");
  }

  tips = nextTips;
  renderTips();
  return result;
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
    imageUrl: formData.get("imageUrl").trim(),
    imageAlt: formData.get("imageAlt").trim(),
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
  storyForm.elements.imageUrl.value = story.imageUrl || "";
  storyForm.elements.imageAlt.value = story.imageAlt || "";
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

function renderTips() {
  tipList.innerHTML = "";

  if (!tips.length) {
    const empty = document.createElement("p");
    empty.className = "editor-status";
    empty.textContent = "No tips waiting.";
    tipList.append(empty);
    return;
  }

  tips.forEach((tip) => {
    const card = document.createElement("article");
    card.className = "tip-card";

    const meta = document.createElement("p");
    meta.className = "tip-meta";
    meta.textContent = `${tip.alias} | ${tip.createdAt ? new Date(tip.createdAt).toLocaleString() : "undated"}`;

    const rumour = document.createElement("p");
    rumour.textContent = tip.rumour;

    const actions = document.createElement("div");
    actions.className = "tip-card-actions";

    const draftButton = document.createElement("button");
    draftButton.type = "button";
    draftButton.textContent = "Make draft";
    draftButton.addEventListener("click", () => createStoryFromTip(tip));

    const dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.textContent = "Dismiss";
    dismissButton.addEventListener("click", () => dismissTip(tip.id));

    actions.append(draftButton, dismissButton);
    card.append(meta, rumour, actions);
    tipList.append(card);
  });
}

function createStoryFromTip(tip) {
  syncCurrentStory();
  const slugBase = slugify(tip.rumour).split("-").slice(0, 8).join("-") || "reader-tip";
  data.stories.unshift({
    slug: slugBase,
    category: "leak",
    categoryLabel: "Leak",
    badge: "Reader tip",
    accent: "blue",
    title: `${tip.rumour.slice(0, 82).replace(/[.?!]*$/, "")}.`,
    description: `A tip from ${tip.alias} has entered the newsroom and refuses to leave quietly.`,
    imageUrl: "",
    imageAlt: "",
    author: "Tip Desk",
    readTime: "3 min read",
    date: data.updatedLabel,
    body: [
      `A reader using the name ${tip.alias} sent the following rumour to the tip line: "${tip.rumour}"`,
      "We have not verified this, but we have placed it on the board with enough red string to make it feel important.",
      "More details as soon as someone dramatically zooms in on something reflective."
    ]
  });
  selectedIndex = 0;
  renderStoryList();
  fillForm();
  setStatus("Tip turned into a draft story. Edit it, save stories, then dismiss the tip.");
}

async function dismissTip(id) {
  if (!window.confirm("Dismiss this tip from the inbox?")) return;

  try {
    setStatus("Updating tip inbox...");
    await saveTips(tips.filter((tip) => tip.id !== id));
    setStatus("Tip dismissed.");
  } catch (error) {
    setStatus(error.message, true);
  }
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
  tips = await requestTips();
  selectedIndex = 0;
  loginPanel.classList.add("hidden");
  editorApp.classList.remove("hidden");
  renderStoryList();
  renderTips();
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
    imageUrl: "",
    imageAlt: "",
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
  const copy = JSON.parse(JSON.stringify(selectedStory()));
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

refreshTipsButton.addEventListener("click", async () => {
  try {
    setStatus("Refreshing tips...");
    tips = await requestTips();
    renderTips();
    setStatus("Tip inbox refreshed.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

uploadImageButton.addEventListener("click", async () => {
  const file = imageFileInput.files[0];
  if (!file) {
    setStatus("Choose an image file first.", true);
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    setStatus("Image is too large. Try under 3 MB.", true);
    return;
  }

  try {
    syncCurrentStory();
    setStatus("Uploading image...");
    uploadImageButton.disabled = true;
    const base64 = await fileToBase64(file);
    const response = await fetch("/api/images", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        storySlug: selectedStory().slug,
        filename: file.name,
        mimeType: file.type,
        base64
      })
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Image upload failed.");
    }

    storyForm.elements.imageUrl.value = result.path;
    if (!storyForm.elements.imageAlt.value) {
      storyForm.elements.imageAlt.value = selectedStory().title;
    }
    syncCurrentStory();
    setStatus(`Image uploaded. Save the story to publish image path ${result.path}.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    uploadImageButton.disabled = false;
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
