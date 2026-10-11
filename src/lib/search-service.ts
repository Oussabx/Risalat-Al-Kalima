import 'server-only';
import { content } from '@/lib/content';
import type { Paged, PostSummary, Term } from '@/lib/content/types';
import { searchDocs } from '@/lib/search';

export type SearchResult = Paged<PostSummary> & { query: string; facets: (Term & { hits: number })[] };

/** Arabic-aware search over the whole archive, with CMS full-text matches merged in. */
export async function runSearch(
  query: string,
  { page = 1, perPage = 12, categoryId }: { page?: number; perPage?: number; categoryId?: number } = {},
): Promise<SearchResult> {
  const q = query.trim().slice(0, 120);
  const empty: SearchResult = { items: [], total: 0, totalPages: 0, page, query: q, facets: [] };
  if (!q) return empty;

  const docs = await content.getSearchDocs();
  const ranked = searchDocs(docs, q).map((h) => h.post);

  // Bodies are not in the local index for WordPress; ask the CMS for those.
  if (content.searchBodies) {
    const extra = await content.searchBodies(q).catch(() => []);
    const seen = new Set(ranked.map((p) => p.id));
    for (const p of extra) {
      if (seen.has(p.id)) continue;
      const indexed = docs.find((d) => d.post.id === p.id)?.post;
      ranked.push(indexed ?? p);
      seen.add(p.id);
    }
  }

  const facetMap = new Map<number, Term & { hits: number }>();
  for (const p of ranked) {
    for (const c of p.categories) {
      const f = facetMap.get(c.id) ?? { ...c, hits: 0 };
      f.hits += 1;
      facetMap.set(c.id, f);
    }
  }

  const filtered = categoryId ? ranked.filter((p) => p.categories.some((c) => c.id === categoryId)) : ranked;
  const start = (page - 1) * perPage;
  const pageIds = filtered.slice(start, start + perPage).map((p) => p.id);
  const items = await content.getPostsByIds(pageIds);

  return {
    items,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / perPage),
    page,
    query: q,
    facets: [...facetMap.values()].sort((a, b) => b.hits - a.hits).slice(0, 8),
  };
}
