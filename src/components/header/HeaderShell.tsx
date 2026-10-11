'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { BookmarkIcon, ChevronDown, MenuIcon, SearchIcon } from '@/components/icons';
import type { Image } from '@/lib/content/types';
import type { SocialKey } from '@/lib/site';
import { MobileDrawer } from './MobileDrawer';
import { SearchOverlay } from './SearchOverlay';

export type NavLink = { label: string; href: string };
export type NavData = {
  primary: NavLink[];
  secondary: NavLink[];
  groups: { title: string; links: NavLink[] }[];
  social: { key: SocialKey; label: string; url: string }[];
};

function normalizePath(p: string) {
  try {
    return decodeURIComponent(p.split('?')[0]).replace(/\/+$/, '') || '/';
  } catch {
    return p;
  }
}

export function useIsActive() {
  const pathname = normalizePath(usePathname() ?? '/');
  return useCallback(
    (href: string) => {
      const target = normalizePath(href);
      return target === '/' ? pathname === '/' : pathname === target || pathname.startsWith(`${target}/`);
    },
    [pathname],
  );
}

export function HeaderShell({ nav, logo }: { nav: NavData; logo?: Image }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  // Overlays remember the page they were opened on, so navigating closes them.
  const [megaAt, setMegaAt] = useState<string | null>(null);
  const [drawerAt, setDrawerAt] = useState<string | null>(null);
  const [searchAt, setSearchAt] = useState<string | null>(null);
  const megaOpen = megaAt === pathname;
  const drawerOpen = drawerAt === pathname;
  const searchOpen = searchAt === pathname;
  const setMegaOpen = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    setMegaAt((prev) => {
      const next = typeof v === 'function' ? v(prev === pathname) : v;
      return next ? pathname : null;
    });
  }, [pathname]);
  const setDrawerOpen = useCallback((v: boolean) => setDrawerAt(v ? pathname : null), [pathname]);
  const setSearchOpen = useCallback((v: boolean) => setSearchAt(v ? pathname : null), [pathname]);
  const isActive = useIsActive();
  const megaRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMegaOpen(false);
    const onClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [megaOpen, setMegaOpen]);

  // "/" opens search, as on most editorial sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  const hover = (open: boolean) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMegaOpen(open), open ? 120 : 200);
  };

  const groupActive = nav.groups.some((g) => g.links.some((l) => isActive(l.href)));

  return (
    <>
      <header
        role="banner"
        className={`no-print sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md transition-shadow duration-300 supports-[backdrop-filter]:bg-white/80 ${
          scrolled ? 'border-line shadow-[0_4px_20px_-12px_rgb(15_23_42/0.25)]' : 'border-transparent'
        }`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          انتقل إلى المحتوى
        </a>
        <div className="container-page">
          <div
            className={`grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-300 ${
              scrolled ? 'h-14 lg:h-16' : 'h-16 lg:h-20'
            }`}
          >
            <div className="flex items-center gap-1 justify-self-start">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-brand-50 hover:text-brand-700"
                aria-label="فتح القائمة"
                aria-expanded={drawerOpen}
                aria-controls="mobile-drawer"
              >
                <MenuIcon size={22} />
              </button>
            </div>

            <Link href="/" className="justify-self-center rounded-md" aria-label="رسالة الكلمة — الصفحة الرئيسية">
              <Logo logo={logo} className={scrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-11'} />
            </Link>

            <div className="flex items-center gap-1 justify-self-end">
              <Link
                href="/saved/"
                className="hidden h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
                aria-label="المقالات المحفوظة"
                title="المقالات المحفوظة"
              >
                <BookmarkIcon size={20} />
              </Link>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-brand-50 hover:text-brand-700"
                aria-label="بحث"
                aria-haspopup="dialog"
                title="بحث ( / )"
              >
                <SearchIcon size={21} />
              </button>
            </div>
          </div>

          <nav aria-label="التنقّل الرئيسي" className="hidden lg:block" ref={megaRef}>
            <ul className="flex items-center justify-center gap-1 pb-2 text-[0.95rem]">
              {nav.primary.map((link) => (
                <li key={link.href}>
                  <NavItem link={link} active={isActive(link.href)} />
                </li>
              ))}
              {nav.groups.length > 0 && (
                <li onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
                  <button
                    type="button"
                    onClick={() => setMegaOpen((v) => !v)}
                    aria-expanded={megaOpen}
                    aria-controls="mega-menu"
                    className={`relative inline-flex items-center gap-1 rounded-lg px-3.5 py-2 font-medium transition hover:text-brand-700 ${
                      megaOpen || groupActive ? 'text-brand-700' : 'text-ink-soft'
                    }`}
                  >
                    الأقسام
                    <ChevronDown size={16} className={`transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`} />
                    {groupActive && <ActiveBar />}
                  </button>
                </li>
              )}
              {nav.secondary.slice(0, 1).map((link) => (
                <li key={link.href}>
                  <NavItem link={link} active={isActive(link.href)} />
                </li>
              ))}
            </ul>

            <div
              id="mega-menu"
              onMouseEnter={() => hover(true)}
              onMouseLeave={() => hover(false)}
              className={`absolute inset-x-0 top-full origin-top border-y border-line bg-white shadow-[0_24px_48px_-24px_rgb(15_23_42/0.25)] transition duration-200 ${
                megaOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
              }`}
            >
              <div className="container-page grid grid-cols-4 gap-8 py-8">
                {nav.groups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted">{group.title}</p>
                    <ul className="space-y-0.5">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            tabIndex={megaOpen ? 0 : -1}
                            className={`-mx-2 block rounded-md px-2 py-1.5 text-[0.95rem] transition hover:bg-brand-50 hover:text-brand-700 ${
                              isActive(link.href) ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-soft'
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} nav={nav} logo={logo} onSearch={() => setSearchOpen(true)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function ActiveBar() {
  return <span aria-hidden className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-brand-500" />;
}

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link
      href={link.href}
      aria-current={active ? 'page' : undefined}
      className={`relative inline-flex rounded-lg px-3.5 py-2 font-medium transition hover:text-brand-700 ${
        active ? 'text-brand-700' : 'text-ink-soft'
      }`}
    >
      {link.label}
      {active && <ActiveBar />}
    </Link>
  );
}
