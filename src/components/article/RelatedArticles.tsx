import type { ArticleSummary } from '@/lib/content/types';
import { ArticleCard } from '../ArticleCard';
import { SectionHeader } from '../SectionHeader';

/**
 * "مقالات ذات صلة": four standard cards with a "view all" link to the article's
 * first category. On phones the cards form a swipeable row (the next card
 * peeks in); from `sm` up they are a grid.
 */
export function RelatedArticles({ articles, viewAllHref, className = '' }: { articles: ArticleSummary[]; viewAllHref: string; className?: string }) {
  if (!articles.length) return null;
  const row = articles.length > 1;
  return (
    <section aria-labelledby="related-title" className={className}>
      <SectionHeader id="related-title" title="مقالات ذات صلة" href={viewAllHref} />
      <ul
        className={
          row
            ? 'no-scrollbar -mx-4 -my-3 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-3 sm:mx-0 sm:my-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 lg:grid-cols-4 lg:gap-6'
            : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-4'
        }
      >
        {articles.map((article) => (
          <li key={article.id} className={row ? 'w-[82%] max-w-[22rem] shrink-0 snap-start sm:w-auto sm:max-w-none' : ''}>
            <ArticleCard article={article} sizes="(min-width: 1240px) 280px, (min-width: 1024px) 23vw, (min-width: 640px) 45vw, 82vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
