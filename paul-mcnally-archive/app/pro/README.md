# Professional edition

`/pro` is a second presentation of the existing portfolio, not a second content library.

- Add Features, Interviews, Reviews and Blog posts in their existing Markdown directories. They automatically appear in both editions, including `/pro/work` and the matching professional collection.
- Professional pages use `featuredImage` from the article front matter. The terminal's pixel listing registry stays exclusive to the terminal edition.
- `data/professional.ts` contains only the ordered slugs for the three homepage selections. All headlines, summaries and images still come from Markdown. Other recent pieces are selected automatically by date.
- About, career and contact information use the existing JSON data. The shared contact form uses the same Formspree endpoint; no email address is added to the page.
- `/pro/features/<slug>`, `/pro/interviews/<slug>`, `/pro/reviews/<slug>` and `/pro/blog/<slug>` render the full shared article. Review category indexes are `/pro/reviews/games` and `/pro/reviews/tech`.
- Article canonical links retain the original terminal URLs to avoid competing duplicate copies. Professional directory pages have their own canonicals and sitemap entries; article social previews use the original featured image.
- `SitePresentation` does not mount terminal video, sound controls, hotkeys or CRT components on `/pro`. Professional CSS is scoped to `.pro-site`; the original edition remains the default.

Build and preview normally. Both editions deploy together as part of the same Vercel project. No extra project, domain or environment variables are needed.
