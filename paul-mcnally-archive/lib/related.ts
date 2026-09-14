export type RelatedArticle = {
  kind: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag?: string;
  category?: string;
  publication?: string;
  related?: string[];
};

const stopWords = new Set([
  "about", "after", "again", "also", "been", "before", "being", "best", "could", "from", "games",
  "have", "into", "just", "more", "most", "much", "news", "only", "over", "paul", "review", "that",
  "their", "there", "these", "they", "this", "through", "what", "when", "where", "which", "while", "with",
  "world", "would", "your"
]);

export function parseRelatedReferences(value?: string) {
  return value?.split(",").map((reference) => reference.trim()).filter(Boolean) || [];
}

export function getArticleReference(article: Pick<RelatedArticle, "kind" | "slug">) {
  return `${article.kind}/${article.slug}`;
}

export function getRelatedLabel(article: Pick<RelatedArticle, "kind" | "category">) {
  if (article.kind === "reviews") return article.category === "tech" ? "Tech review" : "Game review";
  if (article.kind === "opinion") return "Opinion";
  if (article.kind === "blog") return "Blog";
  if (article.kind === "interviews") return "Interview";
  return "Feature";
}

function tokens(value: string) {
  return new Set(
    (value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
      .filter((token) => token.length > 2 && !stopWords.has(token))
  );
}

function overlap(left: Set<string>, right: Set<string>) {
  let matches = 0;
  left.forEach((token) => {
    if (right.has(token)) matches += 1;
  });
  return matches;
}

function relatedScore(current: RelatedArticle, candidate: RelatedArticle) {
  const currentTag = current.tag?.trim().toLocaleLowerCase();
  const candidateTag = candidate.tag?.trim().toLocaleLowerCase();
  const currentSignals = tokens(`${current.tag || ""} ${current.title}`);
  const candidateSignals = tokens(`${candidate.tag || ""} ${candidate.title} ${candidate.excerpt}`);
  const currentContext = tokens(`${current.title} ${current.excerpt}`);
  const candidateContext = tokens(`${candidate.title} ${candidate.excerpt}`);
  let score = 0;

  if (currentTag && currentTag === candidateTag) score += 30;
  if (current.category && current.category === candidate.category) score += 8;
  if (current.kind === candidate.kind) score += 4;
  if (current.publication && current.publication === candidate.publication) score += 1;
  score += overlap(currentSignals, candidateSignals) * 5;
  score += Math.min(overlap(currentContext, candidateContext), 8);

  return score;
}

export function getRelatedArticles<T extends RelatedArticle>(current: T, candidates: T[], limit = 3): T[] {
  const currentReference = getArticleReference(current);
  const available = candidates.filter((candidate) => getArticleReference(candidate) !== currentReference);
  const chosen: T[] = [];
  const chosenReferences = new Set<string>();

  for (const reference of current.related || []) {
    const match = available.find((candidate) => getArticleReference(candidate) === reference || candidate.slug === reference);
    if (!match) continue;
    const matchReference = getArticleReference(match);
    if (!chosenReferences.has(matchReference)) {
      chosen.push(match);
      chosenReferences.add(matchReference);
    }
  }

  const automatic = available
    .filter((candidate) => !chosenReferences.has(getArticleReference(candidate)))
    .map((candidate) => ({ candidate, score: relatedScore(current, candidate) }))
    .sort((left, right) =>
      right.score - left.score
      || right.candidate.date.localeCompare(left.candidate.date)
      || left.candidate.title.localeCompare(right.candidate.title)
    );

  for (const { candidate } of automatic) {
    if (chosen.length >= limit) break;
    chosen.push(candidate);
  }

  return chosen.slice(0, limit);
}
