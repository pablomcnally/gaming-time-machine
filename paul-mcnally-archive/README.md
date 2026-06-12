# Paul McNally Personal Archive

A static-first Next.js personal archive inspired by Micronet, Prestel, Teletext, Ceefax, Viewdata systems and early online services.

The site is designed as a professional personal archive rather than a corporate portfolio. It uses a retro terminal language for structure and atmosphere, while keeping content pages readable and easy to maintain.

## Local Setup

From this folder:

```powershell
cd paul-mcnally-archive
npm install
```

This project uses:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Static generation
- Markdown posts
- TypeScript data files for career and archive entries

## Run Locally

```powershell
npm run dev
```

The default local URL is:

```text
http://localhost:3000
```

If another project is already using port 3000:

```powershell
npm run dev -- --port 3001
```

## Production Build

```powershell
npm run build
```

The site is built with normal Next.js static generation where possible. Vercel can deploy it directly as a Next project.

## Adding Posts

Posts live in:

```text
content/posts
```

Create a new `.md` file with this front matter:

```markdown
---
title: "Post title"
date: "2026-06-11"
slug: "post-title"
excerpt: "Short summary for listings and SEO."
category: "Journalism"
featuredImage: "/archive/press-terminal.svg"
---

Post body goes here.
```

The writing index and individual post pages are generated automatically.

## Editing Site Content

The editor lives at:

```text
/editor
```

It edits these files through normal form fields:

```text
data/home.json
data/about.json
data/contact.json
data/career.json
data/archive.json
data/musings.json
```

The editable sections are:

- Home page intro, status panel, labels, and story stats
- About page panels
- Career timeline entries
- Archive cards
- Contact copy, links, and form endpoint
- Homepage musings/latest rows

The editor expects a password sent to the API. Set this in Vercel:

```text
EDITOR_PASSWORD=your-shared-password
```

For GitHub-backed saves, also add:

```text
GITHUB_TOKEN=your-github-token
GITHUB_REPO=pablomcnally/gaming-time-machine
GITHUB_BRANCH=main
```

If `GITHUB_TOKEN` is not set, the editor falls back to local JSON reads/writes. This is useful for local testing, but Vercel deployments should use GitHub so commits trigger rebuilds.

Local fallback password when `EDITOR_PASSWORD` is not set:

```text
local-preview
```

## Adding Archive Items

Archive items live in:

```text
data/archive.ts
```

Each item supports:

- `image`
- `title`
- `caption`
- `year`
- `category`
- `publication`
- `externalLink`

Valid categories are:

- `magazines`
- `websites`
- `events`
- `press`
- `retro`

Images should be placed in:

```text
public/archive
```

Then reference them from the data file with a root-relative path:

```ts
image: "/archive/my-image.svg"
```

## Updating Career History

Career entries live in:

```text
data/career.ts
```

Each entry supports:

- `year`
- `range`
- `role`
- `company`
- `description`
- `image`
- `link`

The career page reads this file and renders the Teletext/Viewdata-inspired expandable timeline.

## Contact Form

The contact form lives in:

```text
components/ContactForm.tsx
```

The form currently points at a placeholder Formspree endpoint:

```text
https://formspree.io/f/replace-me
```

Replace this with:

- A Formspree form URL
- A Vercel Function endpoint
- A Resend-backed API route

## Retro Features

The site includes lightweight hidden features:

- Type `800` to open the hidden Micronet page.
- Type `999` to open system status.
- Enter the Konami code to reveal a temporary message.
- Press number keys `1` to `6` for the main navigation.

These are implemented in:

```text
components/EasterEggs.tsx
components/RetroNavigation.tsx
```

## Deployment to GitHub

Commit the `paul-mcnally-archive` folder to the repository.

Recommended repository layout:

```text
gaming-time-machine/
  app/
  gta6-truth/
  paul-mcnally-archive/
```

## Deployment to Vercel

Create a new Vercel project from the GitHub repository and use:

```text
Root Directory: paul-mcnally-archive
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
```

Optional environment variable:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

This updates canonical sitemap and Open Graph metadata.

## Project Structure

```text
app/
components/
content/posts/
data/archive.ts
data/career.ts
data/site.ts
lib/posts.ts
public/archive/
```

The guiding principle is simple editing: content is either Markdown or a small TypeScript data array.
