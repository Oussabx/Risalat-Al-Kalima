import Link from 'next/link';
import { CategoryBadge } from '@/components/CategoryBadge';
import { PostImage } from '@/components/PostImage';
import { PostMeta } from '@/components/PostMeta';
import { PlayIcon } from '@/components/icons';
import { formatDate } from '@/lib/arabic';
import type { PostSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';

type Variant = 'default' | 'horizontal' | 'compact' | 'overlay' | 'text';

/**
 * Article teaser. The whole card is clickable through a stretched title link,
 * while badge and author links remain independently reachable.
 */
export function ArticleCard({
  post,
  variant = 'default',
  showExcerpt = false,
  priority = false,
  headingLevel = 3,
  video = false,
  dateOnly = false,
}: {
  post: PostSummary;
  variant?: Variant;
  showExcerpt?: boolean;
  priority?: boolean;
  headingLevel?: 2 | 3 | 4;
  video?: boolean;
  /** Hide the author (e.g. in an author's own list). */
  dateOnly?: boolean;
}) {
  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const category = post.categories[0];
  const href = routes.post(post.slug);
  const titleLink = (
    <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
      {post.title}
    </Link>
  );

  if (variant === 'overlay') {
    return (
      <article className="group relative isolate flex min-h-[22rem] overflow-hidden rounded-[var(--radius-card)] bg-slate-900 focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2">
        <div className="img-zoom absolute inset-0 -z-10">
          <PostImage image={post.image} sizes="(min-width: 1024px) 40vw, 100vw" priority={priority} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
        <div className="mt-auto w-full p-6">
          {category && <CategoryBadge term={category} />}
          <H className="mt-3 text-xl font-bold leading-relaxed text-white sm:text-2xl">{titleLink}</H>
          <div className="mt-3">
            <PostMeta post={post} tone="light" />
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article className="group relative flex gap-4 sm:gap-5">
        <div className="img-zoom relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-brand-50 sm:w-40">
          <PostImage image={post.image} sizes="160px" />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          {category && <p className="relative z-10 mb-1.5 text-xs font-semibold text-brand-700">{category.name}</p>}
          <H className="line-clamp-3 font-bold leading-7 text-ink transition group-hover:text-brand-700 sm:text-[1.05rem] sm:leading-8">{titleLink}</H>
          {showExcerpt && <p className="mt-1.5 line-clamp-2 hidden text-sm leading-7 text-muted sm:block">{post.excerpt}</p>}
          <div className="mt-2">
            <PostMeta post={post} />
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'text') {
    return (
      <article className="group relative">
        {category && <p className="relative z-10 mb-1 text-xs font-semibold text-brand-700">{category.name}</p>}
        <H className="font-bold leading-8 text-ink transition group-hover:text-brand-700">{titleLink}</H>
        <div className="mt-1">
          {dateOnly ? (
            <time dateTime={post.date} className="text-[0.8rem] text-muted">
              {formatDate(post.date)}
            </time>
          ) : (
            <PostMeta post={post} />
          )}
        </div>
      </article>
    );
  }

  const compact = variant === 'compact';
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-within:ring-2 focus-within:ring-brand-500">
      <div className="img-zoom relative aspect-[16/10] overflow-hidden bg-brand-50">
        <PostImage image={post.image} sizes={compact ? '(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw' : '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw'} priority={priority} />
        {video && (
          <span aria-hidden className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lg backdrop-blur transition group-hover:scale-110">
              <PlayIcon size={22} />
            </span>
          </span>
        )}
        {category && (
          <div className="absolute bottom-3 start-3">
            <CategoryBadge term={category} />
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${compact ? 'p-4' : 'p-5'}`}>
        <H className={`font-bold text-ink transition group-hover:text-brand-700 ${compact ? 'line-clamp-2 text-base leading-7' : 'line-clamp-3 text-lg leading-8'}`}>
          {titleLink}
        </H>
        {showExcerpt && post.excerpt && <p className="mt-2 line-clamp-2 text-[0.9rem] leading-7 text-muted">{post.excerpt}</p>}
        <div className="mt-auto pt-4">
          <PostMeta post={post} />
        </div>
      </div>
    </article>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="skeleton aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-11/12" />
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton mt-4 h-3 w-1/3" />
      </div>
    </div>
  );
}
