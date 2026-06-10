# Automated Rumours

The site can publish two AI-written parody stories a day with GitHub Actions.

## How It Works

1. `.github/workflows/gta6-auto-rumours.yml` runs every day at 08:30 UTC.
2. The workflow runs `npm run generate:rumours` inside `gta6-truth`.
3. `scripts/generate-rumours.js` asks OpenAI for fictional parody story JSON.
4. The script adds the stories to `data/stories.json`, updates the ticker, and updates the site date.
5. The workflow runs `npm run build`.
6. GitHub commits the generated JSON and HTML.
7. Vercel sees the commit and redeploys.

## GitHub Setup

Add this repository secret:

```text
OPENAI_API_KEY
```

Optional repository variable:

```text
OPENAI_MODEL
```

If `OPENAI_MODEL` is blank, the script uses `gpt-5.1-mini`.

## Manual Run

In GitHub:

```text
Actions > Generate GTA 6 parody rumours > Run workflow
```

You can choose the number of generated stories. The default is 2.

## Local Dry Run

From `gta6-truth`:

```powershell
$env:OPENAI_API_KEY="your_key_here"
$env:AI_RUMOUR_DRY_RUN="1"
npm run generate:rumours
```

Dry run prints the generated stories without editing `data/stories.json`.

## Safety Notes

The prompt tells the model to avoid real leak claims, real-world allegations, explicit material, and anything presented as genuine insider information. The script also rejects a few risky phrases before committing.

This is still automated publishing, so it is deliberately funny rather than bulletproof. If the bot ever writes something too spicy, edit or delete the story in `/editor/`, then redeploy.
