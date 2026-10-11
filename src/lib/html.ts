import { stripHtml } from '@/lib/arabic';

export type Heading = { id: string; text: string; level: 2 | 3 };

const WP_ORIGIN = (() => {
  try {
    return new URL(process.env.WP_API_URL ?? 'https://risalatalkalima.com/wp-json').origin;
  } catch {
    return 'https://risalatalkalima.com';
  }
})();

/**
 * Prepares CMS article HTML for rendering: removes scripts and inline handlers,
 * gives headings anchors for the table of contents, lazy-loads media and keeps
 * internal links inside the new front end.
 */
export function prepareContent(html: string): { html: string; headings: Heading[] } {
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');

  const headings: Heading[] = [];
  let n = 0;
  out = out.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level: string, attrs: string, inner: string) => {
    const text = stripHtml(inner);
    if (!text) return match;
    const existing = /\sid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const id = existing?.[1] ?? `section-${++n}`;
    headings.push({ id, text, level: Number(level) as 2 | 3 });
    return existing ? match : `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  out = out
    .replace(/<img(?![^>]*\sloading=)/gi, '<img loading="lazy" decoding="async"')
    .replace(/<iframe(?![^>]*\sloading=)/gi, '<iframe loading="lazy"')
    .replace(new RegExp(`href=(["'])${WP_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/(?!wp-content|wp-admin|wp-json)[^"']*)\\1`, 'gi'), 'href=$1$2$1');

  return { html: out, headings };
}
