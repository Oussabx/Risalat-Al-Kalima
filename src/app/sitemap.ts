import type { MetadataRoute } from 'next';
import { content, getCategories, isPreview } from '@/lib/content';
import { routes } from '@/lib/routes';
import { site } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isPreview) return [];
  const [docs, categories] = await Promise.all([content.getSearchDocs(), getCategories()]);
  const abs = (p: string) => `${site.url}${p}`;
  return [
    { url: abs('/'), changeFrequency: 'daily', priority: 1 },
    { url: abs(routes.articles()), changeFrequency: 'daily', priority: 0.8 },
    { url: abs(routes.about), changeFrequency: 'yearly', priority: 0.4 },
    { url: abs(routes.contact), changeFrequency: 'yearly', priority: 0.3 },
    ...categories.map((c) => ({ url: abs(routes.category(c.slug)), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...docs.map((d) => ({ url: abs(routes.post(d.post.slug)), lastModified: d.post.modified, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
