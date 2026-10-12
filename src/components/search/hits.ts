import type { ArticleSummary } from '@/lib/content/types';

/**
 * One item of GET /api/search/ — the contract used by the header search
 * overlay. Optional fields are omitted from the JSON when unknown.
 */
export type SearchHit = {
  slug: string;
  title: string;
  /** ISO 8601 publication date. */
  date: string;
  category?: string;
  author?: string;
  image?: { src: string; alt: string };
};

export type SearchResponse = { total: number; items: SearchHit[] };

export function toSearchHit(article: ArticleSummary): SearchHit {
  return {
    slug: article.slug,
    title: article.title,
    date: article.date,
    category: article.categories[0]?.name,
    author: article.author.name || undefined,
    image: article.image ? { src: article.image.src, alt: article.image.alt } : undefined,
  };
}

/** «نتيجة واحدة» / «نتيجتان» / «5 نتائج» / «24 نتيجة». */
export function resultsLabel(n: number): string {
  if (n === 1) return 'نتيجة واحدة';
  if (n === 2) return 'نتيجتان';
  if (n >= 3 && n <= 10) return `${n} نتائج`;
  return `${n} نتيجة`;
}
