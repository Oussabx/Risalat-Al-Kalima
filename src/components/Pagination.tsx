import Link from 'next/link';
import { ChevronLeft, ChevronRight } from '@/components/icons';

/** Numbered pagination. `hrefFor` builds the URL for a page number. */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const list = [...pages].sort((a, b) => a - b);
  const items: (number | 'gap')[] = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) items.push('gap');
    items.push(p);
  });

  const btn = 'inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-medium transition';
  return (
    <nav aria-label="ترقيم الصفحات" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={`${btn} gap-1 border border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700`}>
          <ChevronRight size={16} /> السابق
        </Link>
      ) : (
        <span className={`${btn} gap-1 border border-line bg-white text-muted/50`} aria-disabled>
          <ChevronRight size={16} /> السابق
        </span>
      )}
      <ul className="hidden items-center gap-1.5 sm:flex">
        {items.map((it, i) =>
          it === 'gap' ? (
            <li key={`g${i}`} className="px-1 text-muted" aria-hidden>
              …
            </li>
          ) : (
            <li key={it}>
              <Link
                href={hrefFor(it)}
                aria-current={it === page ? 'page' : undefined}
                aria-label={`الصفحة ${it}`}
                className={`${btn} ${it === page ? 'bg-brand-600 text-white' : 'border border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700'}`}
              >
                {it}
              </Link>
            </li>
          ),
        )}
      </ul>
      <span className="px-3 text-sm text-muted sm:hidden">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={`${btn} gap-1 border border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700`}>
          التالي <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className={`${btn} gap-1 border border-line bg-white text-muted/50`} aria-disabled>
          التالي <ChevronLeft size={16} />
        </span>
      )}
    </nav>
  );
}
