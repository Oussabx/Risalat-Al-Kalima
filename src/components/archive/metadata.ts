import 'server-only';
import type { Metadata } from 'next';
import { truncate } from '@/lib/arabic';
import { isPreview } from '@/lib/content';
import { site } from '@/lib/site';

/**
 * Metadata for archive and listing pages. `path` is the canonical URL (page
 * number included, sort and other view options left out). `noindex` keeps
 * search results and pages past the end out of search engines.
 */
export function archiveMetadata({
  title,
  description,
  path,
  page = 1,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  page?: number;
  noindex?: boolean;
}): Metadata {
  const fullTitle = page > 1 ? `${title} — الصفحة ${page}` : title;
  const text = truncate(description, 170);
  return {
    title: fullTitle,
    description: text,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: site.fullName, locale: site.locale, title: `${fullTitle} — ${site.fullName}`, description: text, url: path },
    ...(noindex ? { robots: { index: false, follow: !isPreview } } : {}),
  };
}
