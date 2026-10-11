'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { BookmarkIcon, ChevronDown, CloseIcon, SearchIcon, socialIcons } from '@/components/icons';
import type { Image } from '@/lib/content/types';
import { useIsActive, type NavData } from './HeaderShell';
import { useDialog } from './useDialog';

export function MobileDrawer({
  open,
  onClose,
  nav,
  logo,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavData;
  logo?: Image;
  onSearch: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isActive = useIsActive();
  const pathname = usePathname();
  // The reader's choice applies to the page it was made on; elsewhere the
  // group containing the current page starts expanded.
  const [choice, setChoice] = useState<{ path: string | null; title: string | null }>({ path: null, title: null });
  const currentGroup = nav.groups.find((g) => g.links.some((l) => isActive(l.href)))?.title ?? null;
  const expanded = choice.path === pathname ? choice.title : currentGroup;
  const setExpanded = (title: string | null) => setChoice({ path: pathname, title });
  const baseId = useId();
  useDialog(open, onClose, panelRef);

  return (
    <div className={`no-print fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        id="mobile-drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="القائمة"
        inert={!open}
        className={`absolute inset-y-0 start-0 flex w-[88vw] max-w-sm flex-col bg-white transition-[transform,visibility,box-shadow] duration-300 ease-[var(--ease-out-soft)] ${
          open ? 'visible translate-x-0 shadow-2xl' : 'invisible translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Link href="/" onClick={onClose} aria-label="الصفحة الرئيسية">
            <Logo logo={logo} className="h-9" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-brand-50"
            aria-label="إغلاق القائمة"
          >
            <CloseIcon size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSearch();
            }}
            className="mb-5 flex h-12 w-full items-center gap-3 rounded-xl border border-line bg-canvas px-4 text-start text-muted transition hover:border-brand-300"
          >
            <SearchIcon size={19} />
            ابحث في المقالات…
          </button>

          <nav aria-label="القائمة الرئيسية للجوّال">
            <ul className="space-y-0.5">
              {nav.primary.map((link) => (
                <li key={link.href}>
                  <DrawerLink href={link.href} active={isActive(link.href)} onClick={onClose}>
                    {link.label}
                  </DrawerLink>
                </li>
              ))}
            </ul>

            {nav.groups.length > 0 && (
              <>
                <p className="mb-2 mt-6 px-3 text-xs font-semibold text-muted">الأقسام</p>
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {nav.groups.map((group, i) => {
                    const isOpen = expanded === group.title;
                    const panelId = `${baseId}-g${i}`;
                    return (
                      <li key={group.title}>
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : group.title)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          className="flex min-h-12 w-full items-center justify-between px-4 text-start font-medium text-ink"
                        >
                          {group.title}
                          <ChevronDown size={18} className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div
                          id={panelId}
                          className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                        >
                          <ul className="overflow-hidden" inert={!isOpen}>
                            {group.links.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  onClick={onClose}
                                  aria-current={isActive(link.href) ? 'page' : undefined}
                                  className={`flex min-h-11 items-center px-6 text-[0.95rem] transition ${
                                    isActive(link.href) ? 'font-medium text-brand-700' : 'text-ink-soft hover:text-brand-700'
                                  }`}
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                            <li className="h-2" aria-hidden />
                          </ul>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <ul className="mt-6 space-y-0.5">
              <li>
                <DrawerLink href="/saved/" active={isActive('/saved/')} onClick={onClose}>
                  <span className="inline-flex items-center gap-2">
                    <BookmarkIcon size={18} /> المقالات المحفوظة
                  </span>
                </DrawerLink>
              </li>
              {nav.secondary.map((link) => (
                <li key={link.href}>
                  <DrawerLink href={link.href} active={isActive(link.href)} onClick={onClose}>
                    {link.label}
                  </DrawerLink>
                </li>
              ))}
            </ul>
          </nav>

          {nav.social.length > 0 && (
            <ul className="mt-8 flex gap-2 px-3">
              {nav.social.map((s) => {
                const Icon = socialIcons[s.key];
                return (
                  <li key={s.key}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700"
                    >
                      <Icon size={18} />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawerLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-12 items-center rounded-xl px-3 text-[1.02rem] font-medium transition ${
        active ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-canvas'
      }`}
    >
      {children}
    </Link>
  );
}
