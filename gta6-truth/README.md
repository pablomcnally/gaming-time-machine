# GTA 6 - Nothing but the truth

Unofficial parody GTA 6 rumour site.

## Editing Stories

Online editor:

```text
/editor/
```

The editor uses a shared password and saves changes by committing `data/stories.json` back to GitHub. Vercel then redeploys from that commit.

Reader tips submitted on the homepage are saved to:

```text
data/tips.json
```

The editor shows these in the Tip Inbox. Writers can turn a tip into a draft story or dismiss it.

Local fallback: edit story content in:

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

Stories can optionally include `imageUrl` and `imageAlt`. If `imageUrl` is blank, the site uses the coloured story block fallback.

The editor can upload story images to GitHub under:

```text
assets/story-images/
```

## Editor Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```text
EDITOR_PASSWORD
GITHUB_TOKEN
GITHUB_REPO
GITHUB_BRANCH
GITHUB_CONTENT_PATH
GITHUB_TIPS_PATH
GITHUB_IMAGE_PATH
```

Recommended values:

```text
EDITOR_PASSWORD=<shared writer password>
GITHUB_REPO=pablomcnally/gaming-time-machine
GITHUB_BRANCH=main
GITHUB_CONTENT_PATH=gta6-truth/data/stories.json
GITHUB_TIPS_PATH=gta6-truth/data/tips.json
GITHUB_IMAGE_PATH=gta6-truth/assets/story-images
```

`GITHUB_TOKEN` should be a GitHub token with permission to read and write repository contents.
