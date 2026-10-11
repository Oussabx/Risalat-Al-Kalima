/** Canonical URL builders. Paths mirror the original WordPress permalinks. */
const seg = (s: string) => encodeURIComponent(s);

export const routes = {
  home: '/',
  articles: (params?: Record<string, string | number | undefined>) => withQuery('/articles/', params),
  post: (slug: string) => `/${seg(slug)}/`,
  category: (slug: string, params?: Record<string, string | number | undefined>) => withQuery(`/category/${seg(slug)}/`, params),
  tag: (slug: string, params?: Record<string, string | number | undefined>) => withQuery(`/tag/${seg(slug)}/`, params),
  author: (slug: string, params?: Record<string, string | number | undefined>) => withQuery(`/author/${seg(slug)}/`, params),
  search: (params?: Record<string, string | number | undefined>) => withQuery('/search/', params),
  about: '/about/',
  contact: '/contact/',
  saved: '/saved/',
};

export function withQuery(path: string, params?: Record<string, string | number | undefined>) {
  if (!params) return path;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && !(k === 'page' && Number(v) === 1)) qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}
