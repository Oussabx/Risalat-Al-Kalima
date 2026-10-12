import Link from 'next/link';
import type { Ref } from 'react';
import { ArrowLeftIcon, BookIcon, BookmarkIcon } from '../icons';
import { StarIcon } from './menu-icons';
import { MEGA_MENU_ID, currentAttr, matchPath, pageLinks, type NavGroup } from './nav';

const SHORTCUTS = [
  { ...pageLinks.articles, description: 'أرشيف المجلّة كاملًا', Icon: BookIcon },
  { ...pageLinks.picks, description: 'اختارها فريق التحرير', Icon: StarIcon },
  { ...pageLinks.saved, description: 'ما حفظته لتقرأه لاحقًا', Icon: BookmarkIcon },
];

/**
 * Desktop "all sections" panel: every menu category in its group, plus
 * shortcuts to the archive, the editor's picks and saved articles. It stays in
 * the DOM (hidden) so its triggers can always reference it; HeaderBar handles
 * opening, Escape, outside clicks and route changes.
 */
export function MegaMenu({ ref, open, groups, pathname }: { ref?: Ref<HTMLDivElement>; open: boolean; groups: NavGroup[]; pathname: string }) {
  return (
    <div ref={ref} id={MEGA_MENU_ID} hidden={!open} className="absolute inset-x-0 top-full z-10 animate-pop-in border-t border-line bg-white shadow-(--shadow-lift)">
      <div className="container-site grid grid-cols-[repeat(4,minmax(0,1fr))_minmax(14rem,16rem)] gap-x-8 gap-y-6 py-8 xl:gap-x-10">
        {groups.map((group, index) => (
          <div key={group.title} className="min-w-0">
            <h2 id={`${MEGA_MENU_ID}-g${index}`} className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <span className="h-4 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
              {group.title}
            </h2>
            <ul aria-labelledby={`${MEGA_MENU_ID}-g${index}`} className="space-y-0.5">
              {group.links.map((link) => {
                const match = matchPath(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={currentAttr(match)}
                      className={`-mx-2.5 flex min-h-10 items-center rounded-lg px-2.5 text-[0.9375rem] leading-snug transition-colors duration-200 ${
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
        ))}

        <div className="col-start-5 row-start-1 self-start rounded-(--radius-card) border border-brand-100 bg-brand-50 p-4">
          <h2 className="mb-2 px-2 text-sm font-bold text-ink">اكتشف المجلّة</h2>
          <ul className="space-y-1">
            {SHORTCUTS.map(({ Icon, ...item }) => {
              const match = matchPath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={currentAttr(match)}
                    className="group flex items-center gap-3 rounded-xl p-2 transition-colors duration-200 hover:bg-white aria-[current]:bg-white"
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm" aria-hidden="true">
                      <Icon width={19} height={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] font-semibold text-ink group-hover:text-brand-700">{item.label}</span>
                      <span className="block text-meta text-muted">{item.description}</span>
                    </span>
                    <ArrowLeftIcon width={16} height={16} className="shrink-0 text-brand-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
