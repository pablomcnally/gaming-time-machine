export type WorkSearchArticle = {
  title: string;
  excerpt: string;
  publication: string;
  date: string;
  kind: string;
  tag?: string;
  category?: string;
};

export type WorkSort = "newest" | "oldest";

export type WorkFilters = {
  query: string;
  publication: string;
  topic: string;
  sort: WorkSort;
};

export function getWorkFilterOptions(articles: WorkSearchArticle[]) {
  return {
    publications: Array.from(new Set(articles.map((article) => article.publication).filter(Boolean))).sort(),
    topics: Array.from(new Set(articles.map((article) => article.tag).filter((tag): tag is string => Boolean(tag)))).sort()
  };
}

export function filterWorkArticles<T extends WorkSearchArticle>(articles: T[], filters: WorkFilters) {
  const words = filters.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

  return articles
    .filter((article) => {
      const searchable = [
        article.title,
        article.excerpt,
        article.publication,
        article.tag,
        article.kind,
        article.category
      ].filter(Boolean).join(" ").toLocaleLowerCase();

      return (!filters.publication || article.publication === filters.publication)
        && (!filters.topic || article.tag === filters.topic)
        && words.every((word) => searchable.includes(word));
    })
    .sort((left, right) => filters.sort === "oldest"
      ? left.date.localeCompare(right.date)
      : right.date.localeCompare(left.date));
}
