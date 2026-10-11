import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { ArchiveControls } from '@/components/ArchiveControls';
import { ArticleCard } from '@/components/ArticleCard';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { CategoryBadge } from '@/components/CategoryBadge';
import { Pagination } from '@/components/Pagination';
import { PostImage } from '@/components/PostImage';
import { PostMeta } from '@/components/PostMeta';
import { ArrowLeft } from '@/components/icons';
import { countArticles } from '@/lib/arabic';
import type { Paged, PostSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';

/**
 * Shared template for every listing: all articles, categories, tags and authors.
 * The first story on page one is promoted when results are in date order.
 */
export function ArchiveView({
  crumbs,
  eyebrow,
  title,
  description,
  media,
  result,
  hrefFor,
  featureFirst = true,
  controls,
  emptyState,
  video = false,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  media?: ReactNode;
  result: Paged<PostSummary>;
  hrefFor: (page: number) => string;
  featureFirst?: boolean;
  controls?: { categories?: { slug: string; name: string }[]; showSearch?: boolean; showCategory?: boolean };
  emptyState?: ReactNode;
  video?: boolean;
}) {
  const [first, ...rest] = result.items;
  const promote = featureFirst && result.page === 1 && first;
  const grid = promote ? rest : result.items;

  return (
    <div className="container-page pt-6 sm:pt-8">
      <Breadcrumbs items={crumbs} />

      <header className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center" data-reveal>
        {media}
        <div className="min-w-0">
          {eyebrow && <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl font-bold leading-tight text-ink sm:text-4xl">{title}</h1>
          {description && <div className="mt-3 max-w-2xl text-[0.98rem] leading-8 text-muted">{description}</div>}
          <p className="mt-2 text-sm text-muted">
            {countArticles(result.total)}
          </p>
        </div>
      </header>

      {controls && (
        <div className="mt-6 rounded-2xl border border-line bg-canvas/60 p-3 sm:p-4">
          <Suspense fallback={<div className="h-11" />}>
            <ArchiveControls {...controls} />
          </Suspense>
        </div>
      )}

      {result.items.length === 0 ? (
        <div className="mt-10">{emptyState ?? <EmptyState />}</div>
      ) : (
        <>
          {promote && (
            <article className="group relative mt-8 grid overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-card)] md:grid-cols-2" data-reveal>
              <div className="img-zoom relative aspect-[16/10] overflow-hidden bg-brand-50 md:aspect-auto md:min-h-80">
                <PostImage image={first.image} sizes="(min-width: 768px) 50vw, 100vw" priority />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">{result.page === 1 ? 'الأحدث' : ''}</span>
                  {first.categories[0] && <CategoryBadge term={first.categories[0]} tone="soft" />}
                </div>
                <h2 className="mt-4 text-2xl font-bold leading-relaxed text-ink transition group-hover:text-brand-700 sm:text-[1.7rem]">
                  <Link href={routes.post(first.slug)} className="after:absolute after:inset-0 after:content-['']">
                    {first.title}
                  </Link>
                </h2>
                {first.excerpt && <p className="mt-3 line-clamp-3 leading-8 text-muted">{first.excerpt}</p>}
                <div className="mt-5 flex items-center justify-between gap-4">
                  <PostMeta post={first} avatar />
                  <span aria-hidden className="hidden items-center gap-1 text-sm font-semibold text-brand-700 sm:inline-flex">
                    اقرأ المقال <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                  </span>
                </div>
              </div>
            </article>
          )}

          {grid.length > 0 && (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((post, i) => (
                <li key={post.id} data-reveal style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
                  <ArticleCard post={post} showExcerpt priority={!promote && i < 3} headingLevel={2} video={video} />
                </li>
              ))}
            </ul>
          )}

          <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
        </>
      )}
    </div>
  );
}

export function EmptyState({ title = 'لا توجد مقالات هنا بعد', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      <div className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">
        {children ?? (
          <>
            جرّب قسمًا آخر أو{' '}
            <Link href={routes.articles()} className="font-medium text-brand-700 underline underline-offset-4">
              تصفّح كل المقالات
            </Link>
            .
          </>
        )}
      </div>
    </div>
  );
}
