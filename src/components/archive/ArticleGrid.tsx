import Link from 'next/link';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { ArticleCard } from '../ArticleCard';
import { CategoryBadge } from '../CategoryBadge';
import { PostImage } from '../PostImage';
import { PostMeta } from '../PostMeta';
import { CARD_SHELL, GRID_3, GRID_3_SIZES, STRETCHED_LINK } from './styles';

/**
 * Archive grid: three columns on large screens, two from `sm`, one on phones.
 *
 * With `featured` (and at least three articles), the first article becomes a
 * wide horizontal card spanning two columns with a large image and its
 * excerpt. On large screens the next two articles stack beside it as slim
 * cards, so a full page (PAGE_SIZE = 12) fills complete rows.
 */
export function ArticleGrid({
  articles,
  featured = false,
  featuredLabel,
  headingLevel = 2,
  label,
}: {
  articles: ArticleSummary[];
  featured?: boolean;
  /** Small label above the featured title, e.g. «الأحدث». */
  featuredLabel?: string;
  headingLevel?: 2 | 3;
  /** Accessible name of the list. */
  label?: string;
}) {
  const withLead = featured && articles.length >= 3;
  const [lead, ...others] = articles;
  const side = withLead ? others.slice(0, 2) : [];
  const rest = withLead ? others.slice(2) : articles;
  return (
    <ul role="list" aria-label={label} className={GRID_3}>
      {withLead ? (
        <>
          <li className="sm:col-span-2 lg:row-span-2">
            <FeaturedArticleCard article={lead} label={featuredLabel} headingLevel={headingLevel} />
          </li>
          {side.map((article) => (
            <li key={article.id}>
              <SideCard article={article} headingLevel={headingLevel} />
            </li>
          ))}
        </>
      ) : null}
      {rest.map((article, i) => (
        <li key={article.id}>
          <ArticleCard article={article} excerpt headingLevel={headingLevel} sizes={GRID_3_SIZES} priority={!withLead && i < 3} />
        </li>
      ))}
    </ul>
  );
}

/** Wide lead card: image beside the text from `sm` up (stacked on phones), excerpt and full meta. */
export function FeaturedArticleCard({ article, label, headingLevel = 2 }: { article: ArticleSummary; label?: string; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const category = article.categories[0];
  return (
    <article className={`${CARD_SHELL} flex h-full flex-col sm:flex-row`}>
      <div className="relative sm:w-[54%] sm:shrink-0">
        <PostImage
          image={article.image}
          sizes="(min-width: 1240px) 430px, (min-width: 1024px) 36vw, (min-width: 640px) 54vw, 100vw"
          ratio="aspect-[16/10] sm:aspect-auto"
          className="sm:absolute sm:inset-0"
          priority
          zoom
        />
        {category ? (
          <div className="absolute start-3 bottom-3 z-10">
            <CategoryBadge category={category} />
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:min-h-80 sm:p-7">
        {label ? <p className="eyebrow mb-2">{label}</p> : null}
        <H className="text-xl leading-[1.55] font-bold text-ink transition-colors group-hover:text-brand-700 sm:text-[1.4rem]">
          <Link href={routes.article(article.slug)} className={STRETCHED_LINK}>
            {article.title}
          </Link>
        </H>
        {article.excerpt ? <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-[1.9] text-muted sm:line-clamp-4">{article.excerpt}</p> : null}
        <PostMeta article={article} avatar readingTime className="mt-auto pt-5" />
      </div>
    </article>
  );
}

/** Beside the lead on large screens: a slim horizontal card. Below `lg` it is a standard card. */
function SideCard({ article, headingLevel }: { article: ArticleSummary; headingLevel: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const category = article.categories[0];
  return (
    <article className={`${CARD_SHELL} flex h-full flex-col lg:flex-row`}>
      <div className="relative lg:w-[38%] lg:shrink-0">
        <PostImage
          image={article.image}
          sizes="(min-width: 1240px) 150px, (min-width: 1024px) 12vw, (min-width: 640px) 50vw, 100vw"
          ratio="aspect-[16/10] lg:aspect-auto"
          className="lg:absolute lg:inset-0"
          priority
          zoom
        />
        {category ? (
          <div className="absolute start-3 bottom-3 z-10 lg:hidden">
            <CategoryBadge category={category} />
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5 lg:min-h-40 lg:p-4">
        {category ? <p className="eyebrow mb-1 hidden lg:block">{category.name}</p> : null}
        <H className="text-[1.0625rem] leading-[1.65] font-bold text-ink transition-colors group-hover:text-brand-700 lg:line-clamp-3 lg:text-base">
          <Link href={routes.article(article.slug)} className={STRETCHED_LINK}>
            {article.title}
          </Link>
        </H>
        {article.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted lg:hidden">{article.excerpt}</p> : null}
        <PostMeta article={article} className="mt-auto pt-4 lg:pt-3" />
      </div>
    </article>
  );
}
