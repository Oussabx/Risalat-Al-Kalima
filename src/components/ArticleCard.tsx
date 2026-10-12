import Link from 'next/link';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { CategoryBadge } from './CategoryBadge';
import { PostImage } from './PostImage';
import { PostMeta } from './PostMeta';

type Variant = 'standard' | 'horizontal' | 'compact' | 'overlay';

/**
 * Article card. The whole card is clickable through the title link (stretched
 * with ::after); the category badge and author keep their own links above it.
 *
 *  - standard:   image on top, badge on the image, title, optional excerpt, meta
 *  - horizontal: small image beside the text (lists, sidebars, mobile)
 *  - compact:    text only, optionally numbered (dense lists)
 *  - overlay:    text over the image with a dark gradient (feature tiles)
 */
export function ArticleCard({
  article,
  variant = 'standard',
  excerpt = false,
  priority = false,
  headingLevel = 3,
  sizes,
  index,
  className = '',
}: {
  article: ArticleSummary;
  variant?: Variant;
  excerpt?: boolean;
  priority?: boolean;
  headingLevel?: 2 | 3 | 4;
  sizes?: string;
  /** Shows a rank number in the compact variant. */
  index?: number;
  className?: string;
}) {
  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const category = article.categories[0];
  const href = routes.article(article.slug);
  const titleLink = (
    <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
      {article.title}
    </Link>
  );

  if (variant === 'overlay') {
    return (
      <article className={`group relative isolate overflow-hidden rounded-(--radius-card) bg-ink shadow-(--shadow-card) has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500 ${className}`}>
        <PostImage image={article.image} sizes={sizes ?? '(min-width: 1024px) 40vw, 100vw'} priority={priority} ratio="aspect-[4/3] sm:aspect-[16/11]" zoom />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/0" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          {category ? <CategoryBadge category={category} className="mb-3" /> : null}
          <H className="text-xl leading-[1.55] font-bold text-white sm:text-2xl">{titleLink}</H>
          <PostMeta article={article} tone="light" className="mt-3" />
        </div>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article className={`group relative flex items-start gap-4 ${className}`}>
        <PostImage
          image={article.image}
          sizes="(min-width: 640px) 144px, 112px"
          ratio="aspect-[4/3]"
          className="w-28 shrink-0 rounded-xl sm:w-36"
          zoom
        />
        <div className="min-w-0 flex-1">
          {category ? <p className="eyebrow mb-1">{category.name}</p> : null}
          <H className="text-[1rem] leading-[1.65] font-semibold text-ink transition-colors group-hover:text-brand-700 sm:text-[1.0625rem]">{titleLink}</H>
          <PostMeta article={article} className="mt-1.5" />
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className={`group relative flex gap-4 ${className}`}>
        {index !== undefined ? (
          <span className="mt-0.5 w-8 shrink-0 text-2xl leading-none font-bold text-brand-200 tabular-nums" aria-hidden="true">
            {String(index).padStart(2, '0')}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {category ? <p className="eyebrow mb-1">{category.name}</p> : null}
          <H className="text-[1rem] leading-[1.7] font-semibold text-ink transition-colors group-hover:text-brand-700">{titleLink}</H>
          <PostMeta article={article} className="mt-1" />
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-(--radius-card) border border-line bg-surface shadow-(--shadow-card) transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-(--shadow-lift) has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500 ${className}`}
    >
      <div className="relative">
        <PostImage image={article.image} sizes={sizes ?? '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'} priority={priority} zoom />
        {category ? <CategoryBadge category={category} className="absolute bottom-3 left-3" /> : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <H className="text-[1.0625rem] leading-[1.65] font-bold text-ink transition-colors group-hover:text-brand-700">{titleLink}</H>
        {excerpt && article.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{article.excerpt}</p> : null}
        <PostMeta article={article} className="mt-auto pt-4" />
      </div>
    </article>
  );
}
