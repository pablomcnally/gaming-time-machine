import { absoluteUrl, SITE_URL } from "./site";

export const personStructuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: "Paul McNally",
  url: SITE_URL,
  jobTitle: "Games and technology journalist and editor",
  description: "Games and technology journalist, editor and feature writer with more than three decades of experience across print and digital publishing.",
  knowsAbout: [
    "Video games",
    "Technology",
    "Games journalism",
    "Retro computing",
    "Editorial",
    "Interviews"
  ]
};

type ArticleStructuredDataInput = {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  section: string;
  body: string;
  image?: string;
  sourceUrl?: string;
};

export function getArticleStructuredData({
  path,
  title,
  description,
  datePublished,
  dateModified,
  section,
  body,
  image,
  sourceUrl
}: ArticleStructuredDataInput) {
  const pageUrl = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl
    },
    headline: title,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    author: { "@id": `${SITE_URL}/#person` },
    publisher: { "@id": `${SITE_URL}/#person` },
    articleSection: section,
    wordCount: body.trim().split(/\s+/).filter(Boolean).length,
    inLanguage: "en-GB",
    image: image ? [absoluteUrl(image)] : undefined,
    isBasedOn: sourceUrl || undefined
  };
}
