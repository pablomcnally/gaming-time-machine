# Opinion Pieces

Add archived columns and opinion articles as Markdown files in this directory.
They appear automatically at `/opinion`, `/pro/opinion` and in the professional
work library. Retro article page codes start at 302; the directory uses 301.
Keep personal blog posts in `content/blog`.

Use the same front matter as features and interviews:

```yaml
---
title: "Article title"
date: "2020-01-01"
slug: "article-title"
excerpt: "Article summary."
publication: "Original publication"
author: "Paul McNally"
sourceUrl: "https://example.com/original-article"
featuredImage: "/portfolio/opinion/article-title/lead.webp"
featuredImageAlt: "Description of the lead image"
---
```

Preserve the original publication date and source link. Use an archived source
URL when the original has disappeared. Place image files under `public/portfolio/opinion`.
Optional `tag`, `updatedDate` and `imageCredit` fields follow the portfolio format.
Retro listing artwork can be registered in `data/portfolioPreviews.ts`.
