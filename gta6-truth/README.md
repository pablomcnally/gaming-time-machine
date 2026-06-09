# GTA 6 - Nothing but the truth

Unofficial parody GTA 6 rumour site.

## Editing Stories

Edit story content in:

```text
data/stories.json
```

Each story needs a unique `slug`. That slug becomes the story URL:

```text
stories/example-story-slug/
```

After editing, rebuild the static pages:

```powershell
npm run build
```

Commit the updated JSON and generated HTML files.

## Vercel Settings

Use these settings for the Vercel project:

```text
Root Directory: gta6-truth
Framework Preset: Other
Build Command: npm run build
Output Directory: .
Install Command: npm install
```

The generated story pages live under `stories/`, so each article has its own crawlable URL.
