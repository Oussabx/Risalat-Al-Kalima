import { routes } from '@/lib/routes';

/** Plain, serialisable navigation data handed from the server header to its client parts. */
export type NavLink = {
  /** Text shown where space is tight (short label for long category names). */
  label: string;
  /** Full name, used as the accessible name and wherever there is room. */
  name: string;
  href: string;
};
export type NavGroup = { title: string; links: NavLink[] };
export type HeaderNavigation = { primary: NavLink[]; groups: NavGroup[] };

export const MEGA_MENU_ID = 'site-mega-menu';
export const DRAWER_ID = 'site-drawer';
export const SEARCH_DIALOG_ID = 'site-search';

/** The magazine's own pages, shared by the header, drawer, mega menu and footer. */
export const pageLinks = {
  home: { label: 'الرئيسية', href: routes.home() },
  articles: { label: 'المقالات', href: routes.articles() },
  picks: { label: 'مختارات المحرّر', href: routes.picks() },
  saved: { label: 'المحفوظات', href: routes.saved() },
  about: { label: 'من نحن', href: routes.about() },
  contact: { label: 'اتصل بنا', href: routes.contact() },
} as const;

/** Decodes percent-encoding so Arabic slugs compare equal however the URL was written. */
function normalizePath(path: string): string {
  let value = path.split(/[?#]/)[0] || '/';
  try {
    value = decodeURIComponent(value);
  } catch {
    // Malformed encoding: compare the raw value.
  }
  value = value.normalize('NFC');
  return value.endsWith('/') ? value : `${value}/`;
}

export type PathMatch = 'page' | 'section' | null;

/** 'page' when the link points at the current page, 'section' when the current page lives under it. */
export function matchPath(pathname: string, href: string): PathMatch {
  const current = normalizePath(pathname);
  const target = normalizePath(href);
  if (current === target) return 'page';
  if (target !== '/' && current.startsWith(target)) return 'section';
  return null;
}

export function currentAttr(match: PathMatch): 'page' | 'true' | undefined {
  return match === 'page' ? 'page' : match === 'section' ? 'true' : undefined;
}
