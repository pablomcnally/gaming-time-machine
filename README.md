# Gaming Time Machine

A single-page Next.js prototype for a digital museum exhibit about gaming culture in October 1997.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Exhibit content stored in `data/october-1997.json`

## Run Locally

Install dependencies, then start the dev server:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content

Exhibit copy, sections, artifacts, magazine-cover metadata, and source links are organized by year and month:

```text
data/
  1997/
    october.json
```

To add future exhibits, create a four-digit year folder and drop in one JSON file per month, for example
`data/1998/november.json`. The timeline and month selector discover those files automatically.
