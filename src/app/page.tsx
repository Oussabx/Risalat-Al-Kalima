import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { NewsletterBand } from '@/components/NewsletterBand';
import { PostImage } from '@/components/PostImage';
import { PostMeta } from '@/components/PostMeta';
import { SectionHeader } from '@/components/SectionHeader';
import { ArrowLeft, QuoteIcon } from '@/components/icons';
import { categoriesByName, content } from '@/lib/content';
import type { PostSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { homeSections, mediaCategoryNames, site } from '@/lib/site';

export const revalidate = 600;

export default async function HomePage() {
  const [latestPage, stickyPage] = await Promise.all([content.getPosts({ perPage: 16 }), content.getPosts({ sticky: true, perPage: 6 })]);

  const seen = new Set<number>();
  const take = (list: PostSummary[], n: number) => {
    const out = list.filter((p) => !seen.has(p.id)).slice(0, n);
    out.forEach((p) => seen.add(p.id));
    return out;
  };

  const [hero] = take(stickyPage.items.length ? stickyPage.items : latestPage.items, 1);
  // Editor's picks are the remaining sticky posts; shown only when there are at least two.
  const pickPool = stickyPage.items.filter((p) => !seen.has(p.id));
  const picks = pickPool.length >= 2 ? take(pickPool, 3) : [];
  const sideLatest = take(latestPage.items, 4);
  const latestGrid = take(latestPage.items, 6);

  const sections = await Promise.all(
    homeSections.map(async (section) => {
      const cats = await categoriesByName(section.names);
      if (!cats.length) return null;
      const { items } = await content.getPosts({ categoryIds: cats.map((c) => c.id), perPage: 20 });
      return { ...section, primary: cats[0], items };
    }),
  );
  const resolvedSections = sections
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ ...s, items: take(s.items, s.variant === 'list' ? 4 : s.variant === 'feature' ? 4 : 3) }))
    .filter((s) => s.items.length > 0)
    // A feature block needs a lead story plus at least two companions.
    .map((s) => (s.variant === 'feature' && s.items.length < 3 ? { ...s, variant: 'grid' as const } : s));

  const [mediaCat] = await categoriesByName(mediaCategoryNames);
  const media = mediaCat ? take((await content.getPosts({ categoryId: mediaCat.id, perPage: 6 })).items, 3) : [];

  if (!hero) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">{site.fullName}</h1>
        <p className="mt-3 text-muted">لا توجد مقالات منشورة بعد.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="sr-only">
        {site.fullName} — {site.tagline}
      </h1>

      {/* Hero */}
      <section aria-label="المقال المميّز" className="container-page pt-6 sm:pt-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <article className="group relative isolate flex min-h-[26rem] overflow-hidden rounded-[1.5rem] bg-slate-900 animate-fade-up sm:min-h-[30rem] lg:col-span-8 lg:min-h-[34rem]">
            <div className="absolute inset-0 -z-10 transition-transform duration-[1.6s] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]">
              <PostImage image={hero.image} sizes="(min-width: 1024px) 66vw, 100vw" priority />
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-slate-950/0" />
            <div className="mt-auto w-full p-6 sm:p-9 lg:p-11">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{stickyPage.items.length ? 'مقال مميّز' : 'الأحدث'}</span>
                {hero.categories[0] && <CategoryBadge term={hero.categories[0]} />}
              </div>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-[1.4] text-white sm:text-4xl lg:text-[2.75rem]">
                <Link href={routes.post(hero.slug)} className="after:absolute after:inset-0 after:content-['']">
                  {hero.title}
                </Link>
              </h2>
              {hero.excerpt && <p className="mt-4 line-clamp-2 max-w-2xl text-[1.02rem] leading-8 text-white/80">{hero.excerpt}</p>}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <PostMeta post={hero} avatar tone="light" />
                <span className="relative z-10 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-brand-800 shadow-lg transition group-hover:bg-brand-50" aria-hidden>
                  اقرأ المقال
                  <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                </span>
              </div>
            </div>
          </article>

          <aside aria-labelledby="latest-side" className="lg:col-span-4">
            <div className="h-full rounded-[1.5rem] border border-line bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 id="latest-side" className="flex items-center gap-2 text-lg font-bold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
                  </span>
                  أحدث المقالات
                </h2>
                <Link href={routes.articles()} className="text-sm font-medium text-brand-700 hover:text-brand-800">
                  الكل
                </Link>
              </div>
              <ul className="divide-y divide-line">
                {sideLatest.map((post, i) => (
                  <li key={post.id} className="py-4 first:pt-0 last:pb-0 animate-fade-up" style={{ animationDelay: `${120 + i * 80}ms` }}>
                    <ArticleCard post={post} variant="horizontal" />
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* Latest grid */}
      {latestGrid.length > 0 && (
        <section aria-labelledby="latest-title" className="container-page mt-16 lg:mt-20">
          <SectionHeader id="latest-title" title="جديد المجلّة" description="آخر ما نُشر في رسالة الكلمة" href={routes.articles()} linkLabel="كل المقالات" />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latestGrid.map((post, i) => (
              <li key={post.id} data-reveal style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                <ArticleCard post={post} showExcerpt />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Editor's picks (sticky posts chosen in WordPress) */}
      {picks.length > 0 && (
        <section aria-labelledby="picks-title" className="mt-16 bg-white py-14 lg:mt-20 lg:py-16">
          <div className="container-page">
            <SectionHeader id="picks-title" title="مختارات المحرّر" description="مقالات اختارها فريق التحرير لك" />
            <ul className={`grid gap-6 ${picks.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
              {picks.map((post) => (
                <li key={post.id} data-reveal>
                  <ArticleCard post={post} variant="overlay" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Category sections */}
      {resolvedSections.map((s) => (
        <section key={s.title} aria-labelledby={`sec-${s.primary.id}`} className="container-page mt-16 lg:mt-20">
          <SectionHeader id={`sec-${s.primary.id}`} title={s.title} description={s.description} href={routes.category(s.primary.slug)} linkLabel={`المزيد من ${s.primary.name}`} />
          {s.variant === 'feature' ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div data-reveal>
                <ArticleCard post={s.items[0]} variant="overlay" />
              </div>
              <ul className="flex flex-col justify-center gap-6 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-6">
                {s.items.slice(1).map((post) => (
                  <li key={post.id} className="pt-6 first:pt-0" data-reveal>
                    <ArticleCard post={post} variant="horizontal" showExcerpt />
                  </li>
                ))}
              </ul>
            </div>
          ) : s.variant === 'list' ? (
            <ul className="grid gap-x-8 gap-y-6 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-7 md:grid-cols-2">
              {s.items.map((post) => (
                <li key={post.id} data-reveal>
                  <ArticleCard post={post} variant="horizontal" showExcerpt />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map((post) => (
                <li key={post.id} data-reveal>
                  <ArticleCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* Video & multimedia — only when the CMS has such posts */}
      {mediaCat && media.length > 0 && (
        <section aria-labelledby="media-title" className="container-page mt-16 lg:mt-20">
          <SectionHeader id="media-title" title="فيديو ووسائط" href={routes.category(mediaCat.slug)} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((post) => (
              <li key={post.id} data-reveal>
                <ArticleCard post={post} video />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Mission */}
      <section aria-labelledby="mission-title" className="container-page mt-16 lg:mt-24" data-reveal>
        <div className="grid items-center gap-8 rounded-[1.5rem] border border-line bg-white p-7 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:gap-12 lg:p-12">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
            <QuoteIcon size={26} />
          </span>
          <div>
            <h2 id="mission-title" className="text-xl font-bold text-ink sm:text-2xl">
              رسالتنا
            </h2>
            <p className="mt-3 max-w-3xl text-[1.05rem] leading-9 text-ink-soft">{site.description}</p>
          </div>
          <Link href={routes.about} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-brand-200 px-6 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
            تعرّف إلى المجلّة <ArrowLeft size={18} />
          </Link>
        </div>
      </section>

      <NewsletterBand />
    </>
  );
}
