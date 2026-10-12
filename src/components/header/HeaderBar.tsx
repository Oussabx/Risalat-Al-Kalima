'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { SocialLink } from '@/lib/site';
import { ChevronDownIcon, CloseIcon, MenuIcon, SearchIcon } from '../icons';
import { MegaMenu } from './MegaMenu';
import { MobileDrawer } from './MobileDrawer';
import { SearchOverlay } from './SearchOverlay';
import { DRAWER_ID, MEGA_MENU_ID, currentAttr, matchPath, pageLinks, type HeaderNavigation, type NavLink } from './nav';

type Panel = 'none' | 'mega' | 'drawer' | 'search';

/** Tailwind's `lg` breakpoint: the nav row and the mega menu exist from here up. */
const DESKTOP_QUERY = '(min-width: 64rem)';
const subscribeDesktop = (onChange: () => void) => {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const isDesktopNow = () => window.matchMedia(DESKTOP_QUERY).matches;
const isDesktopOnServer = () => false;

/** Scroll distance (px) after which the bar compacts. */
const COMPACT_AFTER = 24;

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function navItemClass(active: boolean): string {
  return `relative inline-flex h-11 items-center gap-1 px-3 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-200 after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:transition-transform after:duration-300 xl:px-3.5 xl:after:inset-x-3.5 ${
    active ? 'text-brand-700 after:scale-x-100 after:bg-brand-500' : 'text-ink-soft after:scale-x-0 after:bg-brand-200 hover:text-brand-700 hover:after:scale-x-100'
  }`;
}

/**
 * Interactive header: sticky bar that compacts on scroll, desktop nav row with
 * the mega menu, the mobile drawer and the search dialog. Only one of the
 * three panels is open at a time; all of them close on navigation.
 */
export function HeaderBar({ logo, drawerLogo, navigation, social }: { logo: ReactNode; drawerLogo: ReactNode; navigation: HeaderNavigation; social: SocialLink[] }) {
  const pathname = usePathname();
  const isDesktop = useSyncExternalStore(subscribeDesktop, isDesktopNow, isDesktopOnServer);
  const [panel, setPanel] = useState<Panel>('none');
  const [compact, setCompact] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const megaTriggerRef = useRef<HTMLElement | null>(null);
  const focusMegaOnOpen = useRef(false);

  // Close on navigation; the mega menu and the drawer also close when the layout crosses the breakpoint.
  const [seen, setSeen] = useState({ pathname, isDesktop });
  if (seen.pathname !== pathname || seen.isDesktop !== isDesktop) {
    setSeen({ pathname, isDesktop });
    if (seen.pathname !== pathname || panel === 'mega' || panel === 'drawer') setPanel('none');
  }

  // Compact state. The bar's lost height is given back as bottom margin (same duration and easing),
  // so the page below never moves and the threshold cannot oscillate.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setCompact(window.scrollY > COMPACT_AFTER);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  // "/" opens search, unless the visitor is typing or another dialog is open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const slash = event.key === '/' || (event.code === 'Slash' && event.key === 'ظ');
      if (!slash || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented || event.isComposing) return;
      if (isTypingTarget(event.target) || document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault();
      setPanel('search');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Mega menu: Escape, outside pointer and focus leaving the header close it.
  useEffect(() => {
    if (panel !== 'mega') return;
    const header = headerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return;
      const focusWasInside = Boolean(header?.contains(document.activeElement)) || document.activeElement === document.body;
      setPanel('none');
      if (focusWasInside) megaTriggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target && (megaRef.current?.contains(target) || target.closest('[data-mega-trigger]'))) return;
      setPanel('none');
    };
    const onFocusIn = (event: FocusEvent) => {
      if (header && !header.contains(event.target as Node)) setPanel('none');
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [panel]);

  // Opened from the hamburger with the keyboard: move focus to the first category.
  useEffect(() => {
    if (panel !== 'mega' || !focusMegaOnOpen.current) return;
    focusMegaOnOpen.current = false;
    megaRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
  }, [panel]);

  const close = () => setPanel('none');

  function toggleMega(event: React.MouseEvent<HTMLButtonElement>) {
    const opening = panel !== 'mega';
    megaTriggerRef.current = event.currentTarget;
    // detail === 0: activated with Enter/Space rather than a pointer.
    focusMegaOnOpen.current = opening && event.detail === 0 && event.currentTarget === menuButtonRef.current;
    setPanel(opening ? 'mega' : 'none');
  }

  function onMenuButton(event: React.MouseEvent<HTMLButtonElement>) {
    if (isDesktopNow()) toggleMega(event);
    else setPanel('drawer');
  }

  // A link inside the open mega menu (or any header link) closes it, even when it points at the current page.
  function onHeaderClick(event: React.MouseEvent) {
    if (panel === 'mega' && (event.target as Element).closest('a[href]')) setPanel('none');
  }

  const megaOpen = panel === 'mega';
  const primaryMatches = navigation.primary.map((link) => matchPath(pathname, link.href));
  const onOtherCategory = matchPath(pathname, '/category/') === 'section' && !primaryMatches.some(Boolean);
  const suggestions = uniqueLinks([...navigation.primary, ...navigation.groups.map((g) => g.links[0])]).slice(0, 8);

  const simpleItem = (link: { label: string; href: string }) => {
    const match = matchPath(pathname, link.href);
    return (
      <li key={link.href}>
        <Link href={link.href} aria-current={currentAttr(match)} className={navItemClass(Boolean(match))}>
          {link.label}
        </Link>
      </li>
    );
  };

  return (
    <>
      <header
        ref={headerRef}
        data-site-header
        onClick={onHeaderClick}
        className={`sticky top-0 z-40 border-b bg-white transition-[margin,box-shadow,border-color] duration-300 ease-out-soft ${
          compact ? 'mb-2 border-transparent shadow-(--shadow-header) lg:mb-6' : 'mb-0 border-line'
        }`}
      >
        <div
          className={`container-site grid grid-cols-[1fr_auto_1fr] items-center gap-2 transition-[height] duration-300 ease-out-soft ${
            compact ? 'h-14 lg:h-12' : 'h-16 lg:h-[4.5rem]'
          }`}
        >
          <div className="flex justify-start">
            <button
              ref={menuButtonRef}
              type="button"
              data-mega-trigger
              onClick={onMenuButton}
              aria-label="القائمة"
              aria-expanded={isDesktop ? megaOpen : panel === 'drawer'}
              aria-controls={isDesktop ? MEGA_MENU_ID : DRAWER_ID}
              aria-haspopup={isDesktop ? undefined : 'dialog'}
              className="icon-btn -ms-2.5"
            >
              {megaOpen ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
            </button>
          </div>

          <div className={`flex min-w-0 justify-center transition-transform duration-300 ease-out-soft ${compact ? 'scale-[0.92] lg:scale-[0.86]' : ''}`}>{logo}</div>

          <div className="flex justify-end">
            <button
              ref={searchButtonRef}
              type="button"
              onClick={() => setPanel('search')}
              aria-label="البحث"
              aria-haspopup="dialog"
              aria-keyshortcuts="/"
              className="icon-btn -me-2.5"
            >
              <SearchIcon width={22} height={22} />
            </button>
          </div>
        </div>

        <nav aria-label="التنقّل الرئيسي" className="hidden lg:block">
          <ul className="container-site flex items-center justify-center gap-0.5">
            {simpleItem(pageLinks.home)}
            {simpleItem(pageLinks.articles)}
            {navigation.primary.map((link, index) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={currentAttr(primaryMatches[index])}
                  aria-label={link.label !== link.name ? link.name : undefined}
                  className={navItemClass(Boolean(primaryMatches[index]))}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button type="button" data-mega-trigger onClick={toggleMega} aria-expanded={megaOpen} aria-controls={MEGA_MENU_ID} className={navItemClass(megaOpen || onOtherCategory)}>
                كل الأقسام
                <ChevronDownIcon width={16} height={16} className={`transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`} />
              </button>
              <MegaMenu ref={megaRef} open={megaOpen} groups={navigation.groups} pathname={pathname} />
            </li>
            {simpleItem(pageLinks.about)}
            {simpleItem(pageLinks.contact)}
          </ul>
        </nav>
      </header>

      {panel === 'drawer' ? (
        <MobileDrawer logo={drawerLogo} groups={navigation.groups} social={social} pathname={pathname} onClose={close} returnFocusRef={menuButtonRef} />
      ) : null}
      {panel === 'search' ? <SearchOverlay suggestions={suggestions} onClose={close} returnFocusRef={searchButtonRef} /> : null}
    </>
  );
}

function uniqueLinks(links: (NavLink | undefined)[]): NavLink[] {
  const seen = new Set<string>();
  return links.filter((link): link is NavLink => {
    if (!link || seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}
