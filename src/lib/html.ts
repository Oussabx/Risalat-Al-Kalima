import sanitizeHtml from 'sanitize-html';
import { stripHtml } from '@/lib/arabic';

export type Heading = { id: string; text: string; level: 2 | 3 };

function originOf(url: string | undefined, fallback: string): string {
  try {
    return new URL(url ?? fallback).origin;
  } catch {
    return new URL(fallback).origin;
  }
}

/** Origins whose links are rewritten to stay inside this front end. */
const INTERNAL_ORIGINS = Array.from(
  new Set([
    originOf(process.env.WP_API_URL, 'https://risalatalkalima.com/wp-json'),
    originOf(process.env.NEXT_PUBLIC_SITE_URL, 'https://risalatalkalima.com'),
    'https://risalatalkalima.com',
    'https://www.risalatalkalima.com',
  ]),
);

/** Video hosts allowed to be embedded in articles. */
const IFRAME_HOSTS = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'www.facebook.com'];

/** Paths that belong to WordPress itself and must keep pointing at it. */
const WP_SYSTEM_PATH = /^\/(wp-content|wp-admin|wp-json|wp-includes|wp-login\.php|feed\/?$)/;

function rewriteHref(href: string): { href: string; external: boolean } {
  const value = href.trim();
  if (value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:')) return { href: value, external: false };
  if (value.startsWith('/') && !value.startsWith('//')) return { href: value, external: false };
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value);
    if (INTERNAL_ORIGINS.includes(url.origin) && !WP_SYSTEM_PATH.test(url.pathname)) {
      return { href: `${url.pathname}${url.search}${url.hash}`, external: false };
    }
    return { href: url.toString(), external: true };
  } catch {
    return { href: '#', external: false };
  }
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'cite', 'q', 'pre', 'code',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
    'a', 'span', 'div', 'figure', 'figcaption', 'img', 'picture', 'source', 'iframe', 'video', 'audio',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding', 'title'],
    source: ['src', 'srcset', 'type', 'media', 'sizes'],
    iframe: ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy'],
    video: ['src', 'controls', 'poster', 'width', 'height', 'preload', 'playsinline'],
    audio: ['src', 'controls', 'preload'],
    p: ['style'],
    div: ['style'],
    figure: ['style'],
    h2: ['id', 'style'],
    h3: ['id', 'style'],
    h4: ['id', 'style'],
    h5: ['style'],
    h6: ['style'],
    td: ['colspan', 'rowspan', 'style'],
    th: ['colspan', 'rowspan', 'scope', 'style'],
    ol: ['start', 'reversed', 'type'],
    blockquote: ['cite'],
    '*': ['class', 'dir', 'lang'],
  },
  // Only the block alignment set in the WordPress editor survives; every other declaration is dropped.
  allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify|start|end)$/] } },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowedIframeHostnames: IFRAME_HOSTS,
  allowProtocolRelative: true,
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'template'],
  transformTags: {
    h1: 'h2',
    a: (tagName, attribs) => {
      if (!attribs.href) return { tagName, attribs };
      const { href, external } = rewriteHref(attribs.href);
      const next: Record<string, string> = { ...attribs, href };
      if (external) {
        next.target = '_blank';
        next.rel = 'noopener noreferrer';
      } else {
        delete next.target;
        delete next.rel;
      }
      return { tagName, attribs: next };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy', decoding: 'async', alt: attribs.alt ?? '' },
    }),
    iframe: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy', title: attribs.title || 'فيديو مضمّن', referrerpolicy: 'strict-origin-when-cross-origin' },
    }),
  },
  exclusiveFilter: (frame) =>
    (frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren?.length) ||
    // A blocked iframe (disallowed host or scheme) loses its src; drop the empty frame entirely.
    (frame.tag === 'iframe' && !frame.attribs.src),
};

/** Sanitises CMS HTML with an allowlist. Safe to inject with dangerouslySetInnerHTML. */
export function sanitize(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

const SAFE_ID = /^[\p{L}\p{N}_-]{1,80}$/u;

/**
 * Ids the page itself renders around the article body (layout, header dialogs,
 * article chrome). A CMS heading may not take them, or #main, the skip link or
 * aria references would point at the wrong element.
 */
const RESERVED_IDS = [
  'main', 'article-body', 'toc-title', 'related-title', 'adjacent-title', 'author-box-title',
  'site-mega-menu', 'site-drawer', 'site-search', 'footer-sections', 'footer-newsletter', 'footer-magazine', 'footer-browse',
];
/** Prefixes of generated page ids (e.g. the mega-menu group headings `site-mega-menu-g0`). */
const RESERVED_ID_PREFIX = /^site-/;

/**
 * Prepares CMS article HTML for rendering: sanitises it, gives h2/h3 headings
 * anchors for the table of contents, wraps tables for horizontal scrolling and
 * keeps internal links inside the new front end. Every heading id in the output
 * (h2–h4) is unique and never clashes with an id of the surrounding page.
 */
export function prepareContent(html: string): { html: string; headings: Heading[] } {
  let out = sanitize(html);

  const headings: Heading[] = [];
  const used = new Set<string>(RESERVED_IDS);
  const usable = (id: string | undefined): id is string => Boolean(id && SAFE_ID.test(id) && !used.has(id) && !RESERVED_ID_PREFIX.test(id));
  let n = 0;
  out = out.replace(/<h([234])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi, (match, level: string, attrs: string, inner: string) => {
    const existing = /\sid="([^"]+)"/i.exec(attrs)?.[1];
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/i, '');
    const text = level === '4' ? '' : stripHtml(inner);
    // h4 and empty headings are not in the outline: they keep a usable CMS id (for in-text anchors) and never get a generated one.
    if (!text) {
      if (existing === undefined) return match;
      if (!usable(existing)) return `<h${level}${cleanAttrs}>${inner}</h${level}>`;
      used.add(existing);
      return match;
    }
    let id = usable(existing) ? existing : '';
    if (!id) {
      do id = `section-${++n}`;
      while (used.has(id));
    }
    used.add(id);
    headings.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });

  out = out.replace(/<table([\s>])/gi, '<div class="table-wrap"><table$1').replace(/<\/table>/gi, '</table></div>');

  return { html: out, headings };
}
