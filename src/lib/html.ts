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
    h2: ['id'],
    h3: ['id'],
    h4: ['id'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    ol: ['start', 'reversed', 'type'],
    blockquote: ['cite'],
    '*': ['class', 'dir', 'lang'],
  },
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
  exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren?.length,
};

/** Sanitises CMS HTML with an allowlist. Safe to inject with dangerouslySetInnerHTML. */
export function sanitize(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

const SAFE_ID = /^[\p{L}\p{N}_-]{1,80}$/u;

/**
 * Prepares CMS article HTML for rendering: sanitises it, gives h2/h3 headings
 * anchors for the table of contents, wraps tables for horizontal scrolling and
 * keeps internal links inside the new front end.
 */
export function prepareContent(html: string): { html: string; headings: Heading[] } {
  let out = sanitize(html);

  const headings: Heading[] = [];
  const used = new Set<string>();
  let n = 0;
  out = out.replace(/<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi, (match, level: string, attrs: string, inner: string) => {
    const text = stripHtml(inner);
    if (!text) return match;
    const existing = /\sid="([^"]+)"/i.exec(attrs)?.[1];
    let id = existing && SAFE_ID.test(existing) && !used.has(existing) ? existing : '';
    if (!id) {
      do id = `section-${++n}`;
      while (used.has(id));
    }
    used.add(id);
    headings.push({ id, text, level: Number(level) as 2 | 3 });
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/i, '');
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });

  out = out.replace(/<table([\s>])/gi, '<div class="table-wrap"><table$1').replace(/<\/table>/gi, '</table></div>');

  return { html: out, headings };
}
