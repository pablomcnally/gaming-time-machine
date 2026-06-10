const tickerData = document.querySelector("#tickerData");
const rumours = tickerData ? JSON.parse(tickerData.textContent) : [];
const heroImagesData = document.querySelector("#heroImagesData");
const heroImages = heroImagesData ? JSON.parse(heroImagesData.textContent) : [];

const tickerText = document.querySelector("#tickerText");
const heroImage = document.querySelector("#heroImage");
const filterButtons = document.querySelectorAll(".filter-button");
const stories = document.querySelectorAll(".story-card[data-category]");
const tipForm = document.querySelector(".tip-form");
const formNote = document.querySelector(".form-note");

let tickerIndex = 0;

if (heroImage && heroImages.length > 1) {
  const selectedHero = heroImages[Math.floor(Math.random() * heroImages.length)];
  heroImage.src = selectedHero.src;
  heroImage.alt = selectedHero.alt;
}

if (tickerText && rumours.length > 0) {
  window.setInterval(() => {
    tickerIndex = (tickerIndex + 1) % rumours.length;
    tickerText.textContent = rumours[tickerIndex];
  }, 4200);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    stories.forEach((story) => {
      const shouldShow = filter === "all" || story.dataset.category === filter;
      story.classList.toggle("hidden", !shouldShow);
    });
  });
});

if (tipForm && formNote) {
  tipForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = tipForm.querySelector("button");
    const formData = new FormData(tipForm);
    const payload = {
      alias: formData.get("alias"),
      rumour: formData.get("rumour"),
      website: formData.get("website")
    };

    formNote.textContent = "Filing tip...";
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Tip line jammed.");
      }

      formNote.textContent = "Filed under: Things We Will Mention With Absolute Confidence.";
      tipForm.reset();
    } catch (error) {
      formNote.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });
}
