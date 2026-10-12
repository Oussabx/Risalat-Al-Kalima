import type { SortOrder } from '@/lib/content/types';

/** URL builders. Paths mirror the original WordPress permalinks (trailing slash included). */

export const routes = {
  home: () => '/',
  article: (slug: string) => `/${slug}/`,
  category: (slug: string, params: { sort?: SortOrder; page?: number } = {}) => withQuery(`/category/${slug}/`, params),
  tag: (slug: string, params: { page?: number } = {}) => withQuery(`/tag/${slug}/`, params),
  author: (slug: string, params: { page?: number } = {}) => withQuery(`/author/${slug}/`, params),
  articles: (params: { q?: string; category?: string; sort?: SortOrder; page?: number } = {}) => withQuery('/articles/', params),
  search: (params: { q?: string; category?: string; page?: number } = {}) => withQuery('/search/', params),
  picks: () => '/picks/',
  saved: () => '/saved/',
  about: () => '/about/',
  contact: () => '/contact/',
  feed: () => '/feed/',
};

function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || (key === 'page' && Number(value) <= 1) || (key === 'sort' && value === 'newest')) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Absolute URL for canonical links, Open Graph and structured data. */
export function absoluteUrl(path: string, base: string): string {
  let decoded = path;
  try {
    decoded = decodeURI(path);
  } catch {
    // Malformed percent sequence: encode the raw path as-is.
  }
  return new URL(encodeURI(decoded), base).toString();
}

/** Reads a positive page number from a search param. */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 1 ? Math.min(n, 1000) : 1;
}

export function parseSort(value: string | string[] | undefined): SortOrder {
  const v = Array.isArray(value) ? value[0] : value;
  return v === 'oldest' || v === 'title' ? v : 'newest';
}

export function parseString(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}
