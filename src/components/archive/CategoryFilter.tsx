import Link from 'next/link';
import { ScrollRow } from './ScrollRow';
import { PILL_HIT_AREA } from './styles';

export type FilterOption = { slug: string; name: string; count?: number };

/**
 * Category chips as links («الكل» first), in a horizontally scrollable row.
 * Works without JavaScript; the active chip carries `aria-current="page"`.
 * `hrefFor(undefined)` must return the unfiltered URL.
 */
export function CategoryFilter({
  options,
  current,
  hrefFor,
  label = 'تصفية حسب القسم',
  allLabel = 'الكل',
  className = '',
}: {
  options: FilterOption[];
  current?: string;
  hrefFor: (slug?: string) => string;
  label?: string;
  allLabel?: string;
  className?: string;
}) {
  const chip = `chip group/chip ${PILL_HIT_AREA} shrink-0 whitespace-nowrap`;
  return (
    <nav aria-label={label} className={className}>
      <ScrollRow>
        {/* Long rows are not prefetched: each chip is a dynamic page. */}
        <ul role="list" className="flex w-max items-center gap-2 px-4 py-1 sm:px-0">
          <li>
            <Link href={hrefFor(undefined)} scroll={false} prefetch={false} aria-current={current ? undefined : 'page'} className={chip}>
              {allLabel}
            </Link>
          </li>
          {options.map((option) => (
            <li key={option.slug}>
              <Link href={hrefFor(option.slug)} scroll={false} prefetch={false} aria-current={option.slug === current ? 'page' : undefined} className={chip}>
                {option.name}
                {option.count !== undefined ? (
                  <span className="-me-1.5 rounded-full bg-surface-2 px-1.5 text-[0.6875rem] leading-5 font-semibold text-ink-soft tabular-nums group-aria-[current=page]/chip:bg-brand-800 group-aria-[current=page]/chip:text-white">
                    <span className="sr-only">(</span>
                    {option.count}
                    <span className="sr-only">)</span>
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </ScrollRow>
    </nav>
  );
}
