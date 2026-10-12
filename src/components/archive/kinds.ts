import { normalizeArabic } from '@/lib/arabic';
import { booksCategoryNames, categoryGroups, mediaCategoryNames } from '@/lib/site';

/** How an archive lays out its articles. */
export type ArchiveKind = 'articles' | 'media' | 'books';

/** Same matching as the content layer: diacritics, hamza forms and spacing are ignored. */
const key = (name: string) => normalizeArabic(name).replace(/\s/g, '');
const sameName = (a: string, b: string) => key(a) === key(b);

export function archiveKind(categoryName: string | undefined): ArchiveKind {
  if (!categoryName) return 'articles';
  if (mediaCategoryNames.some((n) => sameName(n, categoryName))) return 'media';
  if (booksCategoryNames.some((n) => sameName(n, categoryName))) return 'books';
  return 'articles';
}

/** The menu group (from `categoryGroups`) a category belongs to, if any. */
export function categoryGroupOf(categoryName: string): { title: string; names: string[] } | undefined {
  return categoryGroups.find((group) => group.names.some((n) => sameName(n, categoryName)));
}

/** WordPress's default bucket is not a real section of the magazine. */
export function isUncategorized(category: { slug: string; name: string }): boolean {
  return category.slug === 'uncategorized' || sameName(category.name, 'غير مصنف') || sameName(category.name, 'Uncategorized');
}
