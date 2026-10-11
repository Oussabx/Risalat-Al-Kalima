import 'server-only';
import { cache } from 'react';
import { normalizeArabic } from '@/lib/arabic';
import { createFixtureSource } from './fixtures';
import type { ContentSource, Term } from './types';
import { createWordPressSource } from './wordpress';

export type * from './types';

const kind = process.env.CONTENT_SOURCE === 'fixtures' ? 'fixtures' : 'wordpress';

export const content: ContentSource = kind === 'fixtures' ? createFixtureSource() : createWordPressSource();

export const isPreview = content.kind === 'fixtures';

/** Request-deduplicated helpers used across layouts and pages. */
export const getSiteInfo = cache(() => content.getSiteInfo());
export const getCategories = cache(() => content.getCategories());
export const getPostBySlug = cache((slug: string) => content.getPostBySlug(slug));

/** Finds live categories by the names used in the original menu (ignoring diacritics/hamza variants). */
export async function categoriesByName(names: readonly string[]): Promise<Term[]> {
  const all = await getCategories();
  return names
    .map((name) => {
      const wanted = normalizeArabic(name);
      return all.find((c) => normalizeArabic(c.name) === wanted);
    })
    .filter((c): c is Term => Boolean(c));
}

export async function categoryByName(name: string): Promise<Term | null> {
  return (await categoriesByName([name]))[0] ?? null;
}
