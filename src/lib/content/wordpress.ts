import 'server-only';
import { decodeEntities, decodeSlug, readingMinutes, stripHtml } from '@/lib/arabic';
import { site } from '@/lib/site';
import type {
  Author,
  ContentSource,
  Image,
  Page,
  Paged,
  Post,
  PostQuery,
  PostSummary,
  SearchDoc,
  SiteInfo,
  SortKey,
  Term,
} from './types';

/**
 * Headless adapter for the magazine's existing WordPress install (REST API v2).
 * Everything — articles, authors, categories, tags, images and the logo — is
 * read from the CMS, so editors keep publishing exactly as they do today.
 */

const API = (process.env.WP_API_URL ?? 'https://risalatalkalima.com/wp-json').replace(/\/$/, '');
const REVALIDATE = Number(process.env.WP_REVALIDATE_SECONDS ?? 600);
const LIST_FIELDS =
  'id,date,modified,slug,title,excerpt,author,featured_media,sticky,categories,tags,_links,_embedded';
const MAX_INDEX_PAGES = 60;

type WpRendered = { rendered: string };
type WpTerm = { id: number; name: string; slug: string; taxonomy?: string; description?: string; count?: number; parent?: number };
type WpUser = { id: number; name: string; slug: string; description?: string; avatar_urls?: Record<string, string> };
type WpMedia = {
  source_url: string;
  alt_text?: string;
  media_details?: { width?: number; height?: number };
};
type WpPost = {
  id: number;
  date: string;
  modified: string;
  slug: string;
  title: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  author: number;
  sticky?: boolean;
  categories?: number[];
  tags?: number[];
  _embedded?: {
    author?: WpUser[];
    'wp:featuredmedia'?: (WpMedia & { code?: string })[];
    'wp:term'?: WpTerm[][];
  };
};

class NotFoundError extends Error {}

async function wp<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate = REVALIDATE,
): Promise<{ data: T; total: number; totalPages: number }> {
  const url = new URL(API + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate, tags: ['wordpress'] },
  });
  // WordPress answers 400 "rest_post_invalid_page_number" past the last page.
  if (res.status === 400 && params.page && Number(params.page) > 1) {
    return { data: [] as T, total: 0, totalPages: 0 };
  }
  if (res.status === 404) throw new NotFoundError(url.pathname);
  if (!res.ok) throw new Error(`WordPress request failed (${res.status}) for ${url.pathname}`);
  return {
    data: (await res.json()) as T,
    total: Number(res.headers.get('X-WP-Total') ?? 0),
    totalPages: Number(res.headers.get('X-WP-TotalPages') ?? 0),
  };
}

function mapTerm(t: WpTerm): Term {
  return {
    id: t.id,
    slug: decodeSlug(t.slug),
    name: decodeEntities(t.name),
    description: t.description ? stripHtml(t.description) : undefined,
    count: t.count,
    parent: t.parent,
  };
}

function mapAuthor(u: WpUser | undefined, fallbackId: number): Author {
  if (!u || !u.slug) return { id: fallbackId, slug: '', name: site.fullName };
  return {
    id: u.id,
    slug: decodeSlug(u.slug),
    name: decodeEntities(u.name),
    bio: u.description ? stripHtml(u.description) : undefined,
    avatar: u.avatar_urls?.['96'] ?? u.avatar_urls?.['48'],
  };
}

function mapMedia(m: WpMedia | undefined, fallbackAlt: string): Image | undefined {
  if (!m?.source_url) return undefined;
  return {
    src: m.source_url,
    alt: m.alt_text ? decodeEntities(m.alt_text) : fallbackAlt,
    width: m.media_details?.width,
    height: m.media_details?.height,
  };
}

function mapSummary(p: WpPost): PostSummary {
  const title = decodeEntities(stripHtml(p.title.rendered));
  const terms = p._embedded?.['wp:term'] ?? [];
  const flat = terms.flat();
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  return {
    id: p.id,
    slug: decodeSlug(p.slug),
    title,
    excerpt: stripHtml(p.excerpt?.rendered ?? '').replace(/\s*(…|\.\.\.)?\s*(اقرأ المزيد|Read more|Continue reading).*$/i, '…'),
    date: p.date,
    modified: p.modified,
    author: mapAuthor(p._embedded?.author?.[0], p.author),
    categories: flat.filter((t) => t.taxonomy === 'category').map(mapTerm),
    tags: flat.filter((t) => t.taxonomy === 'post_tag').map(mapTerm),
    image: media && !media.code ? mapMedia(media, title) : undefined,
    sticky: p.sticky,
  };
}

function sortParams(sort: SortKey = 'newest') {
  if (sort === 'oldest') return { orderby: 'date', order: 'asc' };
  if (sort === 'title') return { orderby: 'title', order: 'asc' };
  return { orderby: 'date', order: 'desc' };
}

async function fetchAllPages<T>(path: string, params: Record<string, string | number | boolean>, revalidate?: number) {
  const first = await wp<T[]>(path, { ...params, per_page: 100, page: 1 }, revalidate);
  const pages = Math.min(first.totalPages, MAX_INDEX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
      wp<T[]>(path, { ...params, per_page: 100, page: i + 2 }, revalidate).then((r) => r.data),
    ),
  );
  return [...first.data, ...rest.flat()];
}

export function createWordPressSource(): ContentSource {
  let categoriesPromise: Promise<Term[]> | null = null;

  const source: ContentSource = {
    kind: 'wordpress',

    async getSiteInfo(): Promise<SiteInfo> {
      const info: SiteInfo = { name: site.name, description: site.description, url: site.url };
      try {
        const { data } = await wp<{ name?: string; description?: string; site_logo?: number; site_icon_url?: string }>(
          '/',
          { _fields: 'name,description,site_logo,site_icon_url' },
          3600,
        );
        info.icon = data.site_icon_url || undefined;
        const override = process.env.NEXT_PUBLIC_LOGO_URL;
        if (override) {
          info.logo = { src: override, alt: site.fullName };
        } else if (data.site_logo) {
          const media = await wp<WpMedia>(`/wp/v2/media/${data.site_logo}`, { _fields: 'source_url,alt_text,media_details' }, 3600);
          info.logo = mapMedia(media.data, site.fullName);
          if (info.logo) info.logo.alt = site.fullName;
        }
      } catch (error) {
        console.warn('[wordpress] could not load site logo/settings:', (error as Error).message);
      }
      return info;
    },

    async getPosts(query: PostQuery = {}): Promise<Paged<PostSummary>> {
      const page = Math.max(1, query.page ?? 1);
      const { data, total, totalPages } = await wp<WpPost[]>('/wp/v2/posts', {
        _embed: 'author,wp:featuredmedia,wp:term',
        _fields: LIST_FIELDS,
        per_page: query.perPage ?? 12,
        page,
        categories: query.categoryIds?.length ? query.categoryIds.join(',') : query.categoryId,
        tags: query.tagId,
        author: query.authorId,
        sticky: query.sticky,
        exclude: query.exclude?.length ? query.exclude.join(',') : undefined,
        ...sortParams(query.sort),
      });
      return { items: data.map(mapSummary), total, totalPages, page };
    },

    async getPostBySlug(slug: string): Promise<Post | null> {
      const { data } = await wp<WpPost[]>('/wp/v2/posts', {
        slug: decodeSlug(slug),
        _embed: 'author,wp:featuredmedia,wp:term',
      });
      const p = data[0];
      if (!p) return null;
      const html = p.content?.rendered ?? '';
      return { ...mapSummary(p), contentHtml: html, readingMinutes: readingMinutes(stripHtml(html)) };
    },

    async getAdjacentPosts(post: PostSummary) {
      const common = { _embed: 'author,wp:featuredmedia,wp:term', _fields: LIST_FIELDS, per_page: 1, exclude: post.id };
      const [older, newer] = await Promise.all([
        wp<WpPost[]>('/wp/v2/posts', { ...common, before: post.date, orderby: 'date', order: 'desc' }),
        wp<WpPost[]>('/wp/v2/posts', { ...common, after: post.date, orderby: 'date', order: 'asc' }),
      ]);
      return {
        previous: older.data[0] ? mapSummary(older.data[0]) : null,
        next: newer.data[0] ? mapSummary(newer.data[0]) : null,
      };
    },

    async getPageBySlug(slug: string): Promise<Page | null> {
      const { data } = await wp<WpPost[]>('/wp/v2/pages', { slug: decodeSlug(slug), _embed: 'wp:featuredmedia' });
      const p = data[0];
      if (!p) return null;
      const title = decodeEntities(stripHtml(p.title.rendered));
      return {
        id: p.id,
        slug: decodeSlug(p.slug),
        title,
        contentHtml: p.content?.rendered ?? '',
        excerpt: stripHtml(p.excerpt?.rendered ?? ''),
        image: mapMedia(p._embedded?.['wp:featuredmedia']?.[0], title),
      };
    },

    getCategories() {
      categoriesPromise ??= fetchAllPages<WpTerm>('/wp/v2/categories', {
        hide_empty: true,
        _fields: 'id,name,slug,description,count,parent',
      }).then((list) => list.map(mapTerm));
      return categoriesPromise;
    },

    async getCategoryBySlug(slug: string) {
      const wanted = decodeSlug(slug);
      return (await source.getCategories()).find((c) => c.slug === wanted) ?? null;
    },

    async getTagBySlug(slug: string) {
      const { data } = await wp<WpTerm[]>('/wp/v2/tags', { slug: decodeSlug(slug), _fields: 'id,name,slug,description,count' });
      return data[0] ? mapTerm(data[0]) : null;
    },

    async getAuthorBySlug(slug: string) {
      const wanted = decodeSlug(slug);
      try {
        const { data } = await wp<WpUser[]>('/wp/v2/users', { slug: wanted, _fields: 'id,name,slug,description,avatar_urls' });
        if (data[0]) return mapAuthor(data[0], data[0].id);
      } catch {
        // Some security plugins close /users; fall back to authors seen on posts.
      }
      const docs = await source.getSearchDocs();
      return docs.find((d) => d.post.author.slug === wanted)?.post.author ?? null;
    },

    async getSearchDocs(): Promise<SearchDoc[]> {
      const posts = await fetchAllPages<WpPost>(
        '/wp/v2/posts',
        { _embed: 'author,wp:term', _fields: LIST_FIELDS, orderby: 'date', order: 'desc' },
        3600,
      );
      return posts.map((p) => ({ post: mapSummary(p) }));
    },

    async getPostsByIds(ids: number[]) {
      if (!ids.length) return [];
      const { data } = await wp<WpPost[]>('/wp/v2/posts', {
        include: ids.join(','),
        per_page: ids.length,
        orderby: 'include',
        _embed: 'author,wp:featuredmedia,wp:term',
        _fields: LIST_FIELDS,
      });
      return data.map(mapSummary);
    },

    async searchBodies(query: string) {
      const { data } = await wp<WpPost[]>('/wp/v2/posts', {
        search: query,
        per_page: 50,
        _fields: 'id,date,modified,slug,title,excerpt,author,sticky,categories,tags',
      });
      return data.map(mapSummary);
    },
  };

  return source;
}
