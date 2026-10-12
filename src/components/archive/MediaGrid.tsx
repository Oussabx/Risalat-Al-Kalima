import Link from 'next/link';
import { formatDate, isoDate } from '@/lib/arabic';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { CalendarIcon, PlayIcon } from '../icons';
import { PostImage } from '../PostImage';
import { CARD_SHELL, GRID_3, GRID_3_SIZES, STRETCHED_LINK } from './styles';

/**
 * Video treatment for media categories: 16/9 thumbnails with a play mark,
 * title and date. With `featured`, the first video spans two columns (and two
 * rows on large screens, beside the next two videos).
 */
export function MediaGrid({ articles, featured = false, headingLevel = 2, label }: { articles: ArticleSummary[]; featured?: boolean; headingLevel?: 2 | 3; label?: string }) {
  return (
    <ul role="list" aria-label={label} className={GRID_3}>
      {articles.map((article, i) => {
        const lead = featured && i === 0;
        return (
          <li key={article.id} className={lead ? 'sm:col-span-2 lg:row-span-2' : undefined}>
            <MediaCard article={article} lead={lead} priority={i < (featured ? 1 : 3)} headingLevel={headingLevel} />
          </li>
        );
      })}
    </ul>
  );
}

function MediaCard({ article, lead, priority, headingLevel }: { article: ArticleSummary; lead: boolean; priority: boolean; headingLevel: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <article className={`${CARD_SHELL} flex h-full flex-col`}>
      <div className={`relative ${lead ? 'lg:flex lg:min-h-80 lg:flex-1 lg:flex-col' : ''}`}>
        <PostImage
          image={article.image}
          sizes={lead ? '(min-width: 1240px) 790px, (min-width: 1024px) 64vw, 100vw' : GRID_3_SIZES}
          ratio={lead ? 'aspect-video lg:aspect-auto lg:flex-1' : 'aspect-video'}
          priority={priority}
          zoom
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors duration-300 group-hover:bg-black/25" aria-hidden="true">
          <span
            className={`flex items-center justify-center rounded-full bg-white/95 text-brand-600 shadow-lg transition-transform duration-300 group-hover:scale-110 ${lead ? 'size-16 sm:size-20' : 'size-14'}`}
          >
            <PlayIcon width={lead ? 30 : 24} height={lead ? 30 : 24} className="translate-x-px" />
          </span>
        </span>
      </div>
      <div className={`flex flex-col p-4 sm:p-5 ${lead ? '' : 'flex-1'}`}>
        <H className={`font-bold text-ink transition-colors group-hover:text-brand-700 ${lead ? 'text-xl leading-[1.55] sm:text-[1.4rem]' : 'text-[1.0625rem] leading-[1.65]'}`}>
          <Link href={routes.article(article.slug)} className={STRETCHED_LINK}>
            {article.title}
          </Link>
        </H>
        <p className="mt-auto flex items-center gap-1.5 pt-3 text-meta text-muted">
          <CalendarIcon width={15} height={15} />
          <time dateTime={isoDate(article.date)}>{formatDate(article.date)}</time>
        </p>
      </div>
    </article>
  );
}
