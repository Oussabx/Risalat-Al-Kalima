import Link from 'next/link';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons';
import { PostImage } from '../PostImage';

function AdjacentCard({ article, direction }: { article: ArticleSummary; direction: 'previous' | 'next' }) {
  const previous = direction === 'previous';
  const Arrow = previous ? ArrowRightIcon : ArrowLeftIcon;
  return (
    <article
      className={`group relative flex h-full items-center gap-3 rounded-(--radius-card) border border-line bg-surface p-3 shadow-(--shadow-card) transition-[box-shadow,border-color] duration-300 hover:border-brand-200 hover:shadow-(--shadow-lift) has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500 sm:gap-4 ${
        previous ? '' : 'flex-row-reverse sm:col-start-2'
      }`}
    >
      {/* Previous sits on the right with an arrow pointing right; next on the left, pointing left (RTL). */}
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white"
        aria-hidden="true"
      >
        <Arrow width={18} height={18} />
      </span>
      <div className={`min-w-0 flex-1 ${previous ? '' : 'text-end'}`}>
        <p className="eyebrow">{previous ? 'المقال السابق' : 'المقال التالي'}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[0.9375rem] leading-[1.65] font-semibold text-ink transition-colors group-hover:text-brand-700">
          <Link
            href={routes.article(article.slug)}
            rel={previous ? 'prev' : 'next'}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            <span className="sr-only">{previous ? 'المقال السابق: ' : 'المقال التالي: '}</span>
            {article.title}
          </Link>
        </h3>
      </div>
      <PostImage image={article.image} sizes="80px" ratio="aspect-square" className="w-16 shrink-0 rounded-lg sm:w-20" />
    </article>
  );
}

/** Previous / next article (older / newer, as WordPress orders them). */
export function AdjacentNav({ previous, next, className = '' }: { previous: ArticleSummary | null; next: ArticleSummary | null; className?: string }) {
  if (!previous && !next) return null;
  return (
    <nav aria-labelledby="adjacent-title" className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      <h2 id="adjacent-title" className="sr-only">
        المقال السابق والتالي
      </h2>
      {previous ? <AdjacentCard article={previous} direction="previous" /> : null}
      {next ? <AdjacentCard article={next} direction="next" /> : null}
    </nav>
  );
}
