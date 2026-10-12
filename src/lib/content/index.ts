import 'server-only';
import { cache } from 'react';
import { normalizeArabic } from '@/lib/arabic';
import { categoryGroups, primaryCategoryNames } from '@/lib/site';
import { fixturesSource } from './fixtures';
import type { ArticleQuery, ArticleSummary, Category, ContentSource } from './types';
import { wordpressSource } from './wordpress';

export type * from './types';

/** WordPress in production; labelled preview data when CONTENT_SOURCE=fixtures. */
export const content: ContentSource = process.env.CONTENT_SOURCE === 'fixtures' ? fixturesSource : wordpressSource;

/** True when the site shows preview data (pages are then marked noindex and a banner is shown). */
export const isPreview = content.kind === 'fixtures';

export const getIdentity = cache(() => content.getIdentity());
export const getCategories = cache(() => content.getCategories());
export const getArticle = cache((slug: string) => content.getArticle(slug));
export const getAdjacent = cache((article: ArticleSummary) => content.getAdjacent(article));
export const getTag = cache((slug: string) => content.getTag(slug));
export const getAuthor = cache((slug: string) => content.getAuthor(slug));
export const getPage = cache((slug: string) => content.getPage(slug));
export const getSearchIndex = cache(() => content.getSearchIndex());

export function listArticles(query: ArticleQuery) {
  return content.listArticles(query);
}

const key = (name: string) => normalizeArabic(name).replace(/\s/g, '');

/** Finds a live category by its menu name, ignoring diacritics, hamza forms and spacing. */
export async function findCategoryByName(name: string): Promise<Category | undefined> {
  const categories = await getCategories();
  const wanted = key(name);
  return categories.find((c) => key(c.name) === wanted);
}

/** Resolves menu names to live categories, dropping any that do not exist in the CMS. */
export async function resolveCategories(names: readonly string[]): Promise<Category[]> {
  const found = await Promise.all(names.map(findCategoryByName));
  return found.filter((c): c is Category => Boolean(c));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug);
}

export type NavGroup = { title: string; categories: Category[] };
export type Navigation = { primary: Category[]; groups: NavGroup[] };

/** Header, drawer and footer navigation built from the live categories. */
export const getNavigation = cache(async (): Promise<Navigation> => {
  try {
    const [primary, groups] = await Promise.all([
      resolveCategories(primaryCategoryNames),
      Promise.all(categoryGroups.map(async (g) => ({ title: g.title, categories: await resolveCategories(g.names) }))),
    ]);
    return { primary, groups: groups.filter((g) => g.categories.length) };
  } catch (error) {
    console.error('[content] navigation', (error as Error).message);
    return { primary: [], groups: [] };
  }
});

/** The lead story: the newest sticky (editor-featured) article, else the newest article. */
export async function getFeatured(): Promise<ArticleSummary | null> {
  const sticky = await listArticles({ sticky: true, perPage: 1 });
  if (sticky.items[0]) return sticky.items[0];
  const latest = await listArticles({ perPage: 1 });
  return latest.items[0] ?? null;
}

/** Editor-curated selection (WordPress sticky posts). WordPress exposes no view counts. */
export async function getEditorsPicks(limit: number, exclude: number[] = []): Promise<ArticleSummary[]> {
  const { items } = await listArticles({ sticky: true, perPage: limit + exclude.length });
  return items.filter((a) => !exclude.includes(a.id)).slice(0, limit);
}

/**
 * Related articles: shared tags first, then shared categories, then the
 * latest articles, never repeating the article itself or the excluded ones.
 */
export async function getRelated(article: ArticleSummary, limit = 4, exclude: number[] = []): Promise<ArticleSummary[]> {
  const seen = new Set<number>([article.id, ...exclude]);
  const out: ArticleSummary[] = [];
  const take = (items: ArticleSummary[]) => {
    for (const item of items) {
      if (out.length >= limit) return;
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
  };
  const meaningfulTags = article.tags.filter((t) => !article.categories.some((c) => key(c.name) === key(t.name)));
  for (const tag of meaningfulTags.slice(0, 3)) {
    if (out.length >= limit) break;
    take((await listArticles({ tagId: tag.id, perPage: limit + 2, exclude: [...seen] })).items);
  }
  if (out.length < limit && article.categories.length) {
    take((await listArticles({ categoryIds: article.categories.map((c) => c.id), perPage: limit + 2, exclude: [...seen] })).items);
  }
  if (out.length < limit) take((await listArticles({ perPage: limit + 2, exclude: [...seen] })).items);
  return out;
}

/** Articles for one of the configured homepage sections. */
export async function getSectionArticles(names: string[], limit: number, exclude: number[] = []) {
  const categories = await resolveCategories(names);
  if (!categories.length) return { categories, items: [] as ArticleSummary[] };
  const { items } = await listArticles({ categoryIds: categories.map((c) => c.id), perPage: limit, exclude });
  return { categories, items };
}
