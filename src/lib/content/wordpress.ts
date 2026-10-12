import 'server-only';
import { decodeEntities, decodeSlug, readingMinutes, stripHtml, truncate } from '@/lib/arabic';
import { site } from '@/lib/site';
import type {
  Article,
  ArticleQuery,
  ArticleSummary,
  Author,
  Category,
  ContentSource,
  ImageRef,
  PageContent,
  Paged,
  SiteIdentity,
  SitemapEntry,
  Tag,
} from './types';

/**
 * WordPress REST API (wp/v2) content source. Responses are cached with ISR for
 * WP_REVALIDATE_SECONDS and can be refreshed on demand through /api/revalidate.
 */

const API = (process.env.WP_API_URL ?? 'https://risalatalkalima.com/wp-json').replace(/\/$/, '');
const REVALIDATE = Number(process.env.WP_REVALIDATE_SECONDS) || 600;
const TIMEOUT_MS = 12_000;
const SEARCH_INDEX_PAGES = Number(process.env.SEARCH_INDEX_PAGES) || 6;

const SUMMARY_FIELDS = 'id,slug,title,excerpt,date,modified,author,categories,tags,featured_media,sticky,_links,_embedded';
const EMBED = 'author,wp:featuredmedia,wp:term';

type WpRendered = { rendered: string };
type WpMedia = {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: { width?: number; height?: number; sizes?: Record<string, { source_url: string; width: number; height: number }> };
};
type WpUser = { id: number; name: string; slug: string; description?: string; avatar_urls?: Record<string, string> };
type WpTerm = { id: number; name: string; slug: string; taxonomy: string; description?: string; count?: number; parent?: number };
type WpPost = {
  id: number;
  slug: string;
  title: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  date: string;
  modified: string;
  author: number;
  categories?: number[];
  tags?: number[];
  sticky?: boolean;
  _embedded?: { author?: WpUser[]; 'wp:featuredmedia'?: (WpMedia | { code: string })[]; 'wp:term'?: WpTerm[][] };
};

class WordPressError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function wp<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<{ data: T; total: number; totalPages: number }> {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: REVALIDATE, tags: ['wp'] },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: string };
    throw new WordPressError(`WordPress ${res.status} ${body.code ?? ''} for ${url.pathname}`, res.status);
  }
  return {
    data: (await res.json()) as T,
    total: Number(res.headers.get('X-WP-Total') ?? 0),
    totalPages: Number(res.headers.get('X-WP-TotalPages') ?? 0),
  };
}

/** WordPress answers 400 for a page number past the end; treat it as an empty page. */
async function wpList<T>(path: string, params: Record<string, string | number | boolean | undefined>) {
  try {
    return await wp<T[]>(path, params);
  } catch (error) {
    if (error instanceof WordPressError && error.status === 400) return { data: [] as T[], total: 0, totalPages: 0 };
    throw error;
  }
}

function mapImage(media: WpMedia | undefined, fallbackAlt: string): ImageRef | undefined {
  if (!media?.source_url) return undefined;
  const sizes = media.media_details?.sizes ?? {};
  const best = sizes['large'] ?? sizes['medium_large'] ?? sizes['full'];
  return {
    src: best?.source_url ?? media.source_url,
    alt: decodeEntities(media.alt_text || '') || fallbackAlt,
    width: best?.width ?? media.media_details?.width,
    height: best?.height ?? media.media_details?.height,
  };
}

function mapAuthor(user: WpUser | undefined, id: number): Author {
  if (!user) return { id, name: site.name, slug: '', bio: '' };
  return {
    id: user.id,
    name: decodeEntities(user.name),
    slug: decodeSlug(user.slug),
    bio: stripHtml(user.description ?? ''),
    avatar: user.avatar_urls?.['96'] ?? user.avatar_urls?.['48'],
  };
}

function mapTerm(term: WpTerm): Category {
  return {
    id: term.id,
    name: decodeEntities(term.name),
    slug: decodeSlug(term.slug),
    description: stripHtml(term.description ?? ''),
    count: term.count ?? 0,
    parent: term.parent ?? 0,
  };
}

function cleanExcerpt(html: string): string {
  return truncate(
    stripHtml(html)
      .replace(/\[(…|&hellip;|\.\.\.)\]/g, '')
      .replace(/(اقرأ المزيد|Continue reading|Read more).*$/i, '')
      .trim(),
    220,
  );
}

function mapSummary(post: WpPost): ArticleSummary {
  const embedded = post._embedded ?? {};
  const media = embedded['wp:featuredmedia']?.[0];
  const terms = (embedded['wp:term'] ?? []).flat();
  const title = decodeEntities(stripHtml(post.title.rendered));
  return {
    id: post.id,
    slug: decodeSlug(post.slug),
    title,
    excerpt: cleanExcerpt(post.excerpt?.rendered ?? post.content?.rendered ?? ''),
    date: post.date,
    modified: post.modified,
    author: mapAuthor(embedded.author?.[0], post.author),
    categories: terms.filter((t) => t.taxonomy === 'category').map(mapTerm),
    tags: terms.filter((t) => t.taxonomy === 'post_tag').map(mapTerm),
    image: media && 'source_url' in media ? mapImage(media, title) : undefined,
    sticky: Boolean(post.sticky),
    readingMinutes: post.content ? readingMinutes(post.content.rendered) : 0,
  };
}

function orderParams(order: ArticleQuery['order']) {
  if (order === 'oldest') return { orderby: 'date', order: 'asc' };
  if (order === 'title') return { orderby: 'title', order: 'asc' };
  return { orderby: 'date', order: 'desc' };
}

export const wordpressSource: ContentSource = {
  kind: 'wordpress',

  async getIdentity(): Promise<SiteIdentity> {
    const identity: SiteIdentity = { name: site.fullName, description: site.shortDescription };
    if (site.logoUrl) identity.logo = { src: site.logoUrl, alt: site.fullName };
    try {
      const { data } = await wp<{ name?: string; description?: string; site_logo?: number; site_icon_url?: string }>('/');
      if (data.name) identity.name = decodeEntities(data.name);
      if (data.description) identity.description = decodeEntities(data.description);
      if (data.site_icon_url) identity.icon = data.site_icon_url;
      if (!identity.logo && data.site_logo) {
        const { data: media } = await wp<WpMedia>(`/wp/v2/media/${data.site_logo}`);
        identity.logo = {
          src: media.source_url,
          alt: site.fullName,
          width: media.media_details?.width,
          height: media.media_details?.height,
        };
      }
    } catch (error) {
      console.error('[wordpress] identity', (error as Error).message);
    }
    return identity;
  },

  async listArticles(query: ArticleQuery): Promise<Paged<ArticleSummary>> {
    const page = Math.max(1, query.page ?? 1);
    const perPage = Math.min(100, query.perPage ?? 12);
    const { data, total, totalPages } = await wpList<WpPost>('/wp/v2/posts', {
      _embed: EMBED,
      _fields: SUMMARY_FIELDS,
      page,
      per_page: perPage,
      categories: query.categoryIds?.length ? query.categoryIds.join(',') : undefined,
      tags: query.tagId,
      author: query.authorId,
      search: query.search,
      sticky: query.sticky ? true : undefined,
      exclude: query.exclude?.length ? query.exclude.join(',') : undefined,
      include: query.include?.length ? query.include.join(',') : undefined,
      ...orderParams(query.order),
    });
    return { items: data.map(mapSummary), total, totalPages, page, perPage };
  },

  async getArticle(slug: string): Promise<Article | null> {
    const { data } = await wpList<WpPost>('/wp/v2/posts', { slug, _embed: EMBED });
    const post = data[0];
    if (!post) return null;
    return { ...mapSummary(post), contentHtml: post.content?.rendered ?? '' };
  },

  async getAdjacent(article) {
    const params = { _embed: EMBED, _fields: SUMMARY_FIELDS, per_page: 1, exclude: article.id };
    const [older, newer] = await Promise.all([
      wpList<WpPost>('/wp/v2/posts', { ...params, before: article.date, orderby: 'date', order: 'desc' }),
      wpList<WpPost>('/wp/v2/posts', { ...params, after: article.date, orderby: 'date', order: 'asc' }),
    ]);
    return {
      previous: older.data[0] ? mapSummary(older.data[0]) : null,
      next: newer.data[0] ? mapSummary(newer.data[0]) : null,
    };
  },

  async getCategories(): Promise<Category[]> {
    const all: Category[] = [];
    for (let page = 1; page <= 5; page++) {
      const { data, totalPages } = await wpList<WpTerm>('/wp/v2/categories', {
        per_page: 100,
        page,
        hide_empty: false,
        _fields: 'id,name,slug,description,count,parent,taxonomy',
      });
      all.push(...data.map(mapTerm));
      if (page >= totalPages) break;
    }
    return all;
  },

  async getTag(slug: string): Promise<Tag | null> {
    const { data } = await wpList<WpTerm>('/wp/v2/tags', { slug, _fields: 'id,name,slug,description,count,taxonomy' });
    return data[0] ? mapTerm(data[0]) : null;
  },

  async getAuthor(slug: string): Promise<Author | null> {
    try {
      const { data } = await wpList<WpUser>('/wp/v2/users', { slug, _fields: 'id,name,slug,description,avatar_urls' });
      return data[0] ? mapAuthor(data[0], data[0].id) : null;
    } catch (error) {
      // Some security plugins hide /users; fall back to an author embedded in a post.
      console.error('[wordpress] author', (error as Error).message);
      const { data } = await wpList<WpPost>('/wp/v2/posts', { per_page: 100, _embed: 'author', _fields: 'id,author,_links,_embedded' });
      const user = data.map((p) => p._embedded?.author?.[0]).find((u) => u && decodeSlug(u.slug) === slug);
      return user ? mapAuthor(user, user.id) : null;
    }
  },

  async getPage(slug: string): Promise<PageContent | null> {
    const { data } = await wpList<WpPost>('/wp/v2/pages', { slug, _embed: 'wp:featuredmedia' });
    const page = data[0];
    if (!page) return null;
    const media = page._embedded?.['wp:featuredmedia']?.[0];
    const title = decodeEntities(stripHtml(page.title.rendered));
    return {
      id: page.id,
      slug: decodeSlug(page.slug),
      title,
      contentHtml: page.content?.rendered ?? '',
      modified: page.modified,
      image: media && 'source_url' in media ? mapImage(media, title) : undefined,
    };
  },

  async getSearchIndex(): Promise<ArticleSummary[]> {
    const items: ArticleSummary[] = [];
    for (let page = 1; page <= SEARCH_INDEX_PAGES; page++) {
      const { data, totalPages } = await wpList<WpPost>('/wp/v2/posts', {
        _embed: EMBED,
        _fields: SUMMARY_FIELDS,
        per_page: 50,
        page,
        orderby: 'date',
        order: 'desc',
      });
      items.push(...data.map(mapSummary));
      if (page >= totalPages) break;
    }
    return items;
  },

  async getSitemapEntries() {
    const collect = async (path: string): Promise<SitemapEntry[]> => {
      const out: SitemapEntry[] = [];
      for (let page = 1; page <= 50; page++) {
        const { data, totalPages } = await wpList<{ slug: string; modified: string }>(path, { per_page: 100, page, _fields: 'slug,modified' });
        out.push(...data.map((d) => ({ slug: decodeSlug(d.slug), modified: d.modified })));
        if (page >= totalPages) break;
      }
      return out;
    };
    const [articles, pages] = await Promise.all([collect('/wp/v2/posts'), collect('/wp/v2/pages')]);
    return { articles, pages };
  },
};
