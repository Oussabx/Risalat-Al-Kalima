import Link from 'next/link';
import type { SortOrder } from '@/lib/content/types';
import { PILL_HIT_AREA } from './styles';

/** There is no popularity data in WordPress, so only date and title orders are offered. */
export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'title', label: 'أبجديًّا' },
];

/**
 * Sort switch built from plain links, so it works without JavaScript and every
 * state has its own URL. `hrefFor` must keep the other filters and reset the page.
 */
export function SortControl({ current, hrefFor, className = '' }: { current: SortOrder; hrefFor: (sort: SortOrder) => string; className?: string }) {
  return (
    <nav aria-label="ترتيب المقالات" className={`flex items-center gap-2.5 ${className}`}>
      <span className="text-meta font-medium text-muted" aria-hidden="true">
        ترتيب:
      </span>
      <ul role="list" className="flex items-center gap-0.5 rounded-full border border-line bg-white p-1">
        {SORT_OPTIONS.map((option) => {
          const active = option.value === current;
          return (
            <li key={option.value}>
              <Link
                href={hrefFor(option.value)}
                scroll={false}
                aria-current={active ? 'page' : undefined}
                className={`${PILL_HIT_AREA} inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  active ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
