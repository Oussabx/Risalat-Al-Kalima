import { listArticles, type ArticleSummary } from '@/lib/content';
import { absoluteUrl, routes } from '@/lib/routes';
import { site } from '@/lib/site';

/** RSS 2.0 feed of the latest 20 articles (the WordPress /feed/ URL is preserved). */

export const revalidate = 600;

const INVALID_XML = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g;

function xml(value: string): string {
  return value
    .replace(INVALID_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC 822 date, as RSS 2.0 requires (e.g. "Tue, 08 Sep 2026 09:00:00 GMT"). */
function rfc822(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toUTCString();
}

function item(article: ArticleSummary): string {
  const link = absoluteUrl(routes.article(article.slug), site.url);
  const pubDate = rfc822(article.date);
  return [
    '    <item>',
    `      <title>${xml(article.title)}</title>`,
    `      <link>${xml(link)}</link>`,
    `      <guid isPermaLink="true">${xml(link)}</guid>`,
    pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
    article.author?.name ? `      <dc:creator>${xml(article.author.name)}</dc:creator>` : '',
    ...article.categories.map((category) => `      <category>${xml(category.name)}</category>`),
    article.excerpt ? `      <description>${xml(article.excerpt)}</description>` : '',
    '    </item>',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function GET() {
  const { items } = await listArticles({ perPage: 20, order: 'newest' });
  const self = absoluteUrl(routes.feed(), site.url);
  const lastBuild = rfc822(items[0]?.modified || items[0]?.date || '') ?? new Date().toUTCString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(site.fullName)}</title>
    <link>${xml(`${site.url}/`)}</link>
    <description>${xml(site.description)}</description>
    <language>ar</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml"/>
${items.map(item).join('\n')}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
    },
  });
}
