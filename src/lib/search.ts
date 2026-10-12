import { normalizeArabic, searchTokens, stripArticle } from '@/lib/arabic';
import type { ArticleSummary } from '@/lib/content/types';

/** Field weights: a title match outranks an author match, which outranks categories/tags, then the excerpt. */
const WEIGHTS = { title: 10, author: 6, terms: 4, excerpt: 2 } as const;

type Field = keyof typeof WEIGHTS;

function fieldWords(text: string): string[] {
  return normalizeArabic(text).split(' ').filter(Boolean).map(stripArticle);
}

/** Matches a query token against a word: exact, or prefix for tokens of 3+ characters. */
function tokenMatches(token: string, word: string): 0 | 1 | 2 {
  if (word === token) return 2;
  if (token.length >= 3 && word.startsWith(token)) return 1;
  if (token.length >= 4 && word.includes(token)) return 1;
  return 0;
}

export type ScoredArticle = { article: ArticleSummary; score: number };

/**
 * Scores an article for an Arabic query. Every query token must match some
 * field; the score sums the best weighted match for each token, with a bonus
 * for a phrase match in the title.
 */
export function scoreArticle(article: ArticleSummary, query: string): number {
  const tokens = searchTokens(query);
  if (!tokens.length) return 0;

  const fields: Record<Field, string[]> = {
    title: fieldWords(article.title),
    author: fieldWords(article.author.name),
    terms: fieldWords([...article.categories.map((c) => c.name), ...article.tags.map((t) => t.name)].join(' ')),
    excerpt: fieldWords(article.excerpt),
  };

  let score = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of Object.keys(fields) as Field[]) {
      for (const word of fields[field]) {
        const m = tokenMatches(token, word);
        if (m) best = Math.max(best, WEIGHTS[field] * (m === 2 ? 1 : 0.6));
      }
    }
    if (!best) return 0;
    score += best;
  }

  const phrase = normalizeArabic(query);
  if (phrase.includes(' ') && normalizeArabic(article.title).includes(phrase)) score += 15;
  return score;
}

/** Ranks articles for a query, best first; ties go to the newer article. */
export function rankArticles(articles: ArticleSummary[], query: string): ScoredArticle[] {
  return articles
    .map((article) => ({ article, score: scoreArticle(article, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.article.date.localeCompare(a.article.date));
}
