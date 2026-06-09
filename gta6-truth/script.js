const rumours = [
  "Anonymous source claims the moon is a playable vehicle if you pre-order twice.",
  "A menu beep has allegedly confirmed 19 radio stations and one deeply tired podcast.",
  "Fans identify a possible convenience store from a reflection inside another reflection.",
  "Publisher remains silent after journalist asks whether water will be wet.",
  "New theory suggests every palm tree is individually voice-acted."
];

const tickerText = document.querySelector("#tickerText");
const filterButtons = document.querySelectorAll(".filter-button");
const stories = document.querySelectorAll(".story-card[data-category]");
const tipForm = document.querySelector(".tip-form");
const formNote = document.querySelector(".form-note");

let tickerIndex = 0;

window.setInterval(() => {
  tickerIndex = (tickerIndex + 1) % rumours.length;
  tickerText.textContent = rumours[tickerIndex];
}, 4200);

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

tipForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formNote.textContent = "Filed under: Things We Will Mention With Absolute Confidence.";
  tipForm.reset();
});
