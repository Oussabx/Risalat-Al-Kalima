import { content } from '@/lib/content';
import { routes } from '@/lib/routes';
import { site } from '@/lib/site';

export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 feed at the same /feed/ address WordPress used. */
export async function GET() {
  const { items } = await content.getPosts({ perPage: 20 });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${esc(site.fullName)}</title>
<link>${site.url}/</link>
<atom:link href="${site.url}/feed/" rel="self" type="application/rss+xml"/>
<description>${esc(site.description)}</description>
<language>ar</language>
${items
  .map(
    (p) => `<item>
<title>${esc(p.title)}</title>
<link>${site.url}${routes.post(p.slug)}</link>
<guid isPermaLink="true">${site.url}${routes.post(p.slug)}</guid>
<pubDate>${new Date(p.date).toUTCString()}</pubDate>
<dc:creator>${esc(p.author.name)}</dc:creator>
${p.categories.map((c) => `<category>${esc(c.name)}</category>`).join('')}
<description>${esc(p.excerpt)}</description>
</item>`,
  )
  .join('\n')}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
