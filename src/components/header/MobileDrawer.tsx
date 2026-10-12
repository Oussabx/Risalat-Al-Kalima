'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { routes } from '@/lib/routes';
import type { SocialLink } from '@/lib/site';
import { SocialLinks } from '../footer/SocialLinks';
import { BookIcon, BookmarkIcon, ChevronDownIcon, CloseIcon, HomeIcon, MailIcon, SearchIcon } from '../icons';
import { InfoIcon, StarIcon } from './menu-icons';
import { DRAWER_ID, currentAttr, matchPath, pageLinks, type NavGroup } from './nav';
import { useModalDialog } from './use-modal-dialog';

const MAIN_LINKS = [
  { ...pageLinks.home, Icon: HomeIcon },
  { ...pageLinks.articles, Icon: BookIcon },
  { ...pageLinks.picks, Icon: StarIcon },
  { ...pageLinks.saved, Icon: BookmarkIcon },
  { ...pageLinks.about, Icon: InfoIcon },
  { ...pageLinks.contact, Icon: MailIcon },
];

/**
 * Mobile navigation drawer (slides in from the right, the start side in RTL).
 * Mounted only while open; HeaderBar closes it on route changes.
 */
export function MobileDrawer({
  logo,
  groups,
  social,
  pathname,
  onClose,
  returnFocusRef,
}: {
  logo: ReactNode;
  groups: NavGroup[];
  social: SocialLink[];
  pathname: string;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  // The group holding the current category starts expanded.
  const [expanded, setExpanded] = useState<string[]>(() => groups.filter((g) => g.links.some((l) => matchPath(pathname, l.href))).map((g) => g.title));

  useModalDialog(rootRef, { onClose, initialFocusRef: closeRef, returnFocusRef });

  function toggle(title: string) {
    setExpanded((list) => (list.includes(title) ? list.filter((t) => t !== title) : [...list, title]));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(routes.search({ q }));
    onClose();
  }

  // Following any in-site link closes the drawer, including a link to the page already open.
  function onLinkClick(event: React.MouseEvent) {
    if ((event.target as Element).closest('a[href]:not([target="_blank"])')) onClose();
  }

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[70]" onClick={onLinkClick}>
      <div className="absolute inset-0 animate-fade-in bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        id={DRAWER_ID}
        role="dialog"
        aria-modal="true"
        aria-label="القائمة"
        tabIndex={-1}
        className="absolute inset-y-0 start-0 flex w-[min(23rem,88vw)] animate-drawer-in flex-col bg-white shadow-(--shadow-lift) outline-none"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line ps-4 pe-2">
          {logo}
          <button ref={closeRef} type="button" onClick={onClose} className="icon-btn" aria-label="إغلاق القائمة">
            <CloseIcon width={22} height={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-8">
          <form role="search" action={routes.search()} method="get" onSubmit={onSubmit} className="relative">
            <label htmlFor={`${uid}-q`} className="sr-only">
              ابحث في المجلّة
            </label>
            <input
              id={`${uid}-q`}
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
              autoComplete="off"
              placeholder="ابحث في المجلّة…"
              className="field pe-12 [&::-webkit-search-cancel-button]:appearance-none"
            />
            <button type="submit" className="icon-btn absolute end-0.5 top-1/2 -translate-y-1/2 text-brand-600" aria-label="بحث">
              <SearchIcon width={20} height={20} />
            </button>
          </form>

          <nav aria-label="صفحات المجلّة" className="mt-4">
            <ul className="space-y-0.5">
              {MAIN_LINKS.map(({ Icon, ...link }) => {
                const match = matchPath(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={currentAttr(match)}
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors duration-200 ${
                        match ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-surface-2 hover:text-brand-700'
                      }`}
                    >
                      <Icon width={20} height={20} className={match ? 'text-brand-600' : 'text-muted'} />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {groups.length ? (
            <nav aria-labelledby={`${uid}-sections`} className="mt-6">
              <h2 id={`${uid}-sections`} className="mb-2 px-3 text-meta font-semibold text-muted">
                الأقسام
              </h2>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                {groups.map((group, index) => {
                  const open = expanded.includes(group.title);
                  const panelId = `${uid}-g${index}`;
                  return (
                    <li key={group.title}>
                      <h3>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={panelId}
                          onClick={() => toggle(group.title)}
                          className="flex min-h-13 w-full items-center justify-between gap-3 px-4 text-start text-base font-semibold text-ink transition-colors duration-200 hover:bg-surface-2"
                        >
                          {group.title}
                          <ChevronDownIcon
                            width={18}
                            height={18}
                            className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-brand-600' : 'text-muted'}`}
                          />
                        </button>
                      </h3>
                      <div id={panelId} hidden={!open} className="pb-2">
                        <ul>
                          {group.links.map((link) => {
                            const match = matchPath(pathname, link.href);
                            return (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  aria-current={currentAttr(match)}
                                  className={`mx-2 flex min-h-11 items-center rounded-lg ps-5 pe-3 text-[0.9375rem] transition-colors duration-200 ${
                                    match ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-soft hover:bg-surface-2 hover:text-brand-700'
                                  }`}
                                >
                                  {link.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </div>

        {social.length ? (
          <div className="shrink-0 border-t border-line px-4 py-4">
            <p className="mb-2 text-meta font-semibold text-muted">تابعونا</p>
            <SocialLinks links={social} />
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
