import type { MetadataRoute } from 'next';
import { content, getCategories } from '@/lib/content';
import { decodeSlug } from '@/lib/arabic';
import { absoluteUrl, routes } from '@/lib/routes';
import { site } from '@/lib/site';

export const revalidate = 3600;

const url = (path: string) => absoluteUrl(path, site.url);

const lastModified = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * Home, static pages, every article, category and WordPress page. A CMS outage
 * must never break the sitemap: each source fails independently and the static
 * entries are always present.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: url(routes.home()), changeFrequency: 'daily', priority: 1 },
    { url: url(routes.articles()), changeFrequency: 'daily', priority: 0.8 },
    { url: url(routes.picks()), changeFrequency: 'weekly', priority: 0.6 },
    { url: url(routes.about()), changeFrequency: 'yearly', priority: 0.5 },
    { url: url(routes.contact()), changeFrequency: 'yearly', priority: 0.4 },
  ];

  const [published, categories] = await Promise.all([
    content.getSitemapEntries().catch((error: Error) => {
      console.error('[sitemap] entries', error.message);
      return { articles: [], pages: [] };
    }),
    getCategories().catch((error: Error) => {
      console.error('[sitemap] categories', error.message);
      return [];
    }),
  ]);

  for (const article of published.articles) {
    entries.push({ url: url(routes.article(article.slug)), lastModified: lastModified(article.modified), changeFrequency: 'monthly', priority: 0.7 });
  }

  for (const category of categories) {
    if (category.count > 0) entries.push({ url: url(routes.category(category.slug)), changeFrequency: 'weekly', priority: 0.6 });
  }

  // The About and Contact pages are served at /about/ and /contact/ (listed above).
  const servedElsewhere = new Set([site.aboutPageSlug, site.contactPageSlug].map(decodeSlug));
  for (const page of published.pages) {
    if (servedElsewhere.has(decodeSlug(page.slug))) continue;
    entries.push({ url: url(routes.article(page.slug)), lastModified: lastModified(page.modified), changeFrequency: 'yearly', priority: 0.4 });
  }

  return entries;
}
