import Link from 'next/link';
import { formatDate, isoDate } from '@/lib/arabic';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { PostImage } from '../PostImage';
import { STRETCHED_LINK } from './styles';

/**
 * Library treatment for book categories: 3/4 covers on a shelf-like grid
 * (two columns on phones, three from `sm`, four on large screens), the title
 * and who wrote the article.
 */
export function BookGrid({ articles, headingLevel = 2, label }: { articles: ArticleSummary[]; headingLevel?: 2 | 3; label?: string }) {
  return (
    <ul role="list" aria-label={label} className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-11">
      {articles.map((article, i) => (
        <li key={article.id}>
          <BookCard article={article} priority={i < 4} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}

function BookCard({ article, priority, headingLevel }: { article: ArticleSummary; priority: boolean; headingLevel: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative overflow-hidden rounded-lg shadow-(--shadow-card) ring-1 ring-black/5 transition-[box-shadow,transform] duration-300 group-hover:-translate-y-1 group-hover:shadow-(--shadow-lift) group-has-[a:focus-visible]:ring-2 group-has-[a:focus-visible]:ring-brand-500">
        <PostImage image={article.image} sizes="(min-width: 1240px) 270px, (min-width: 1024px) 22vw, (min-width: 640px) 31vw, 46vw" ratio="aspect-[3/4]" priority={priority} zoom />
        {/* Spine shading on the binding side (the start side for Arabic books). */}
        <span className="pointer-events-none absolute inset-y-0 start-0 w-4 bg-gradient-to-l from-black/25 via-black/5 to-transparent" aria-hidden="true" />
      </div>
      <H className="mt-3.5 line-clamp-3 text-[0.9375rem] leading-[1.65] font-bold text-ink transition-colors group-hover:text-brand-700 sm:text-base">
        <Link href={routes.article(article.slug)} className={STRETCHED_LINK}>
          {article.title}
        </Link>
      </H>
      <p className="mt-1.5 text-meta text-muted">
        بقلم{' '}
        {article.author.slug ? (
          <Link href={routes.author(article.author.slug)} className="relative z-10 font-medium text-ink-soft transition-colors hover:text-brand-700">
            {article.author.name}
          </Link>
        ) : (
          <span className="font-medium text-ink-soft">{article.author.name}</span>
        )}
      </p>
      <time dateTime={isoDate(article.date)} className="mt-0.5 text-meta text-muted">
        {formatDate(article.date)}
      </time>
    </article>
  );
}
