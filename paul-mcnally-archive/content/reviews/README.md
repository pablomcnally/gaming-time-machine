# Review content guide

Add each review as a Markdown file in this directory. The filename should match the `slug`, for example:

```text
content/reviews/example-game-review.md
```

The Reviews loader ignores this README and validates every other `.md` file. `category` is required and must be exactly `games` or `tech`; this determines which directory lists the review. All reviews share one date-ordered sequence, with article page codes beginning at 704.

## Front matter template

```yaml
---
title: "Exact review headline"
date: "2026-08-26"
updatedDate: "2026-08-27"
slug: "example-game-review"
excerpt: "A concise summary used on listings and in search metadata."
publication: "Publication name"
author: "Paul McNally"
category: "games"
tag: "Retro Gaming"
featuredImage: "/portfolio/reviews/example-game-review/featured.jpg"
featuredImageAlt: "A useful description of the featured image"
imageCredit: "Optional image credit"
sourceUrl: "https://example.com/original-review"
---

Review copy begins here.

## A section heading

Paragraphs use normal Markdown. Images use:

![Descriptive alternative text](/portfolio/reviews/example-game-review/image.jpg "Optional caption")

Videos use:

[YOUTUBE:https://www.youtube.com/watch?v=VIDEO_ID|Accessible video title]
```

## Required fields

- `title`
- `date` in `YYYY-MM-DD` format
- `slug`
- `excerpt`
- `publication`
- `author`
- `category`, using either `games` or `tech`
- `sourceUrl`

## Optional fields

- `updatedDate`
- `tag`
- `featuredImage`
- `featuredImageAlt` (include whenever `featuredImage` is used)
- `imageCredit`

Store article media under `public/portfolio/reviews/<slug>/`. A review without a featured image remains valid and uses the site's Pablonet placeholder treatment in listings. Dedicated pixel preview art can be registered in `data/portfolioPreviews.ts` without replacing photographic media inside the article.
