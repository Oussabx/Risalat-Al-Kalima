import 'server-only';
import { normalizeArabic } from '@/lib/arabic';
import { content, getSearchIndex } from '@/lib/content';
import type { ArticleSummary } from '@/lib/content/types';
import { rankArticles } from '@/lib/search';

export type SearchFacet = { slug: string; name: string; count: number };

export type SearchResult = {
  query: string;
  items: ArticleSummary[];
  total: number;
  totalPages: number;
  page: number;
  facets: SearchFacet[];
};

/**
 * Arabic search over real content. Titles, authors, categories, tags and
 * excerpts are ranked locally with Arabic normalisation; WordPress full-text
 * search adds matches found only in article bodies.
 */
export async function runSearch(rawQuery: string, opts: { page?: number; perPage?: number; category?: string } = {}): Promise<SearchResult> {
  const query = rawQuery.trim().slice(0, 100);
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? 12;
  if (!normalizeArabic(query)) return { query, items: [], total: 0, totalPages: 0, page, facets: [] };

  const [index, fullText] = await Promise.all([
    getSearchIndex(),
    content.listArticles({ search: query, perPage: 40 }).catch((error) => {
      console.error('[search] full text', (error as Error).message);
      return { items: [] as ArticleSummary[] };
    }),
  ]);

  const ranked = rankArticles(index, query).map((r) => r.article);
  const seen = new Set(ranked.map((a) => a.id));
  const merged = [...ranked, ...fullText.items.filter((a) => !seen.has(a.id))];

  const facetMap = new Map<string, SearchFacet>();
  for (const article of merged) {
    for (const c of article.categories) {
      const f = facetMap.get(c.slug) ?? { slug: c.slug, name: c.name, count: 0 };
      f.count++;
      facetMap.set(c.slug, f);
    }
  }
  const facets = [...facetMap.values()].sort((a, b) => b.count - a.count);

  const filtered = opts.category ? merged.filter((a) => a.categories.some((c) => c.slug === opts.category)) : merged;
  const total = filtered.length;
  return {
    query,
    items: filtered.slice((page - 1) * perPage, page * perPage),
    total,
    totalPages: Math.ceil(total / perPage),
    page,
    facets,
  };
}
