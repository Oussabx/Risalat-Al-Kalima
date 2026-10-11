import type { MetadataRoute } from 'next';
import { isPreview } from '@/lib/content';
import { site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (isPreview) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/saved/', '/search/'] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
