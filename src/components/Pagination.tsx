import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

function pageList(current: number, total: number): (number | 'gap')[] {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

/** Numbered pagination built from real page counts. Renders nothing for a single page. */
export function Pagination({ page, totalPages, hrefFor, className = '' }: { page: number; totalPages: number; hrefFor: (page: number) => string; className?: string }) {
  if (totalPages <= 1) return null;
  const item = 'inline-flex size-11 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors';
  return (
    <nav aria-label="التنقّل بين الصفحات" className={`mt-12 flex items-center justify-center gap-1.5 ${className}`}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className="btn-ghost gap-1.5 px-3">
          <ArrowRightIcon width={16} height={16} />
          <span>السابقة</span>
        </Link>
      ) : (
        <span className="btn-ghost gap-1.5 px-3 opacity-40" aria-hidden="true">
          <ArrowRightIcon width={16} height={16} />
          <span>السابقة</span>
        </span>
      )}
      <ol className="flex items-center gap-1">
        {pageList(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} className="px-1 text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p} className={p !== page && Math.abs(p - page) > 1 && p !== 1 && p !== totalPages ? 'hidden sm:block' : ''}>
              {p === page ? (
                <span aria-current="page" className={`${item} bg-brand-600 text-white`}>
                  <span className="sr-only">الصفحة </span>
                  {p}
                </span>
              ) : (
                <Link href={hrefFor(p)} className={`${item} text-ink-soft hover:bg-brand-100 hover:text-brand-700`}>
                  <span className="sr-only">الصفحة </span>
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className="btn-ghost gap-1.5 px-3">
          <span>التالية</span>
          <ArrowLeftIcon width={16} height={16} />
        </Link>
      ) : (
        <span className="btn-ghost gap-1.5 px-3 opacity-40" aria-hidden="true">
          <span>التالية</span>
          <ArrowLeftIcon width={16} height={16} />
        </span>
      )}
    </nav>
  );
}
