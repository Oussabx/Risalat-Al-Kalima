import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { AuthorAvatar } from '@/components/AuthorAvatar';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CategoryBadge } from '@/components/CategoryBadge';
import { NewsletterBand } from '@/components/NewsletterBand';
import { PostImage } from '@/components/PostImage';
import { PostMeta } from '@/components/PostMeta';
import { SectionHeader } from '@/components/SectionHeader';
import { ArrowLeft, ArrowRight, ClockIcon } from '@/components/icons';
import { formatDate, readingLabel } from '@/lib/arabic';
import type { Post, PostSummary } from '@/lib/content/types';
import { prepareContent } from '@/lib/html';
import { routes } from '@/lib/routes';
import { BookmarkButton } from './BookmarkButton';
import { ReadingProgressBar, ReadingProgressMeter } from './ReadingProgress';
import { ShareControls } from './ShareControls';
import { TableOfContents } from './TableOfContents';

export function ArticleView({
  post,
  previous,
  next,
  related,
  byAuthor,
}: {
  post: Post;
  previous: PostSummary | null;
  next: PostSummary | null;
  related: PostSummary[];
  byAuthor: PostSummary[];
}) {
  const { html, headings } = prepareContent(post.contentHtml);
  const category = post.categories[0];
  const url = routes.post(post.slug);
  const saved = {
    slug: post.slug,
    title: post.title,
    date: post.date,
    author: post.author.name,
    category: category?.name,
    image: post.image?.src,
  };

  return (
    <>
      <ReadingProgressBar />
      <article className="pb-24 lg:pb-0">
        <div className="container-page pt-5 sm:pt-8">
          {/* Hero */}
          <header className="animate-fade-up">
            {post.image ? (
              <div className="relative isolate flex min-h-[19rem] overflow-hidden rounded-[1.25rem] bg-slate-900 sm:min-h-[24rem] lg:min-h-[28rem]">
                <div className="absolute inset-0 -z-10">
                  <PostImage image={post.image} sizes="(min-width: 1280px) 1216px, 100vw" priority />
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/5" />
                <div className="mt-auto w-full p-5 sm:p-8 lg:p-12">
                  {category && <CategoryBadge term={category} />}
                  <h1 className="mt-3 max-w-4xl text-[1.85rem] font-bold leading-[1.45] text-white sm:text-4xl lg:text-5xl lg:leading-[1.35]">{post.title}</h1>
                  <div className="mt-4 text-sm">
                    <PostMeta post={post} avatar tone="light" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.25rem] border border-line bg-gradient-to-bl from-brand-100 via-white to-white p-6 sm:p-10 lg:p-14">
                {category && <CategoryBadge term={category} />}
                <h1 className="mt-4 max-w-4xl text-[1.85rem] font-bold leading-[1.45] text-ink sm:text-4xl lg:text-5xl lg:leading-[1.35]">{post.title}</h1>
                <div className="mt-5 text-sm">
                  <PostMeta post={post} avatar />
                </div>
              </div>
            )}
          </header>

          <Breadcrumbs
            className="mt-5"
            items={[
              { label: 'المقالات', href: routes.articles() },
              ...(category ? [{ label: category.name, href: routes.category(category.slug) }] : []),
              { label: post.title },
            ]}
          />

          <div className="mt-6 grid gap-10 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-16">
            {/* Reading column */}
            <div className="print-full min-w-0">
              <div className="mx-auto max-w-[44rem]">
                <div className="mb-6 flex items-center gap-4 text-sm text-muted lg:hidden">
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon size={16} /> مدّة القراءة: {readingLabel(post.readingMinutes)}
                  </span>
                </div>

                <div id="article-body" className="prose-ar" dangerouslySetInnerHTML={{ __html: html }} />

                {post.tags.length > 0 && (
                  <div className="mt-10 border-t border-line pt-6">
                    <h2 className="sr-only">الوسوم</h2>
                    <ul className="flex flex-wrap gap-2">
                      {post.tags.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={routes.tag(t.slug)}
                            rel="tag"
                            className="inline-flex rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-ink-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                          >
                            #{t.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="no-print mt-8 hidden items-center gap-2 lg:flex">
                  <span className="me-2 text-sm text-muted">هل أعجبك المقال؟</span>
                  <ShareControls title={post.title} url={url} variant="full" />
                  <BookmarkButton article={saved} variant="full" />
                </div>

                {/* Author */}
                <section aria-label="عن الكاتب" className="no-print mt-10 rounded-2xl border border-line bg-white p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <AuthorAvatar author={post.author} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted">بقلم</p>
                      <h2 id="author-title" className="mt-0.5 text-lg font-bold text-ink">
                        {post.author.slug ? (
                          <Link href={routes.author(post.author.slug)} className="hover:text-brand-700">
                            {post.author.name}
                          </Link>
                        ) : (
                          post.author.name
                        )}
                      </h2>
                      {post.author.bio && <p className="mt-2 text-[0.95rem] leading-7 text-muted">{post.author.bio}</p>}
                    </div>
                  </div>
                  {byAuthor.length > 0 && (
                    <div className="mt-6 border-t border-line pt-5">
                      <p className="mb-3 text-sm font-semibold text-ink">من مقالات الكاتب</p>
                      <ul className="space-y-4">
                        {byAuthor.map((p) => (
                          <li key={p.id}>
                            <ArticleCard post={p} variant="text" headingLevel={3} dateOnly />
                          </li>
                        ))}
                      </ul>
                      {post.author.slug && (
                        <Link href={routes.author(post.author.slug)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
                          كل مقالات {post.author.name} <ArrowLeft size={16} />
                        </Link>
                      )}
                    </div>
                  )}
                </section>

                {/* Previous / next */}
                {(previous || next) && (
                  <nav aria-label="مقالات متتالية" className="no-print mt-8 grid gap-4 sm:grid-cols-2">
                    {previous ? <AdjacentLink post={previous} direction="previous" /> : <span className="hidden sm:block" />}
                    {next && <AdjacentLink post={next} direction="next" />}
                  </nav>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="no-print hidden lg:block" aria-label="معلومات المقال">
              <div className="sticky top-32 space-y-6">
                <div className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-center gap-3">
                    <AuthorAvatar author={post.author} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{post.author.name}</p>
                      <time dateTime={post.date} className="text-[0.8rem] text-muted">
                        {formatDate(post.date)}
                      </time>
                    </div>
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                    <ClockIcon size={16} /> مدّة القراءة: {readingLabel(post.readingMinutes)}
                  </p>
                  <div className="mt-4">
                    <ReadingProgressMeter />
                  </div>
                  <div className="mt-5 flex gap-2 border-t border-line pt-4">
                    <BookmarkButton article={saved} />
                    <ShareControls title={post.title} url={url} />
                  </div>
                </div>
                <TableOfContents headings={headings} />
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile action bar */}
        <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:hidden">
          <div className="container-page flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookmarkButton article={saved} />
              <ShareControls title={post.title} url={url} />
            </div>
            <ReadingProgressMeter compact />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="no-print container-page mt-16 lg:mt-20">
          <SectionHeader id="related-title" title="مقالات ذات صلة" href={category ? routes.category(category.slug) : routes.articles()} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id} data-reveal>
                <ArticleCard post={p} variant="compact" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="no-print">
        <NewsletterBand />
      </div>
    </>
  );
}

function AdjacentLink({ post, direction }: { post: PostSummary; direction: 'previous' | 'next' }) {
  const isPrev = direction === 'previous';
  return (
    <Link
      href={routes.post(post.slug)}
      rel={isPrev ? 'prev' : 'next'}
      className={`group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[var(--shadow-card)] ${
        isPrev ? '' : 'sm:flex-row-reverse sm:text-end'
      }`}
    >
      <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50">
        <PostImage image={post.image} sizes="80px" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`flex items-center gap-1 text-xs font-semibold text-brand-700 ${isPrev ? '' : 'sm:justify-end'}`}>
          {isPrev ? (
            <>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /> المقال السابق
            </>
          ) : (
            <>
              المقال التالي <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            </>
          )}
        </span>
        <span className="mt-1 line-clamp-2 font-semibold leading-7 text-ink group-hover:text-brand-700">{post.title}</span>
      </span>
    </Link>
  );
}
