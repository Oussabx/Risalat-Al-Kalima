import type { MetadataRoute } from 'next';
import { isPreview } from '@/lib/content';
import { site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Preview builds run on labelled sample data and must never be indexed.
  if (isPreview) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/saved/'] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
