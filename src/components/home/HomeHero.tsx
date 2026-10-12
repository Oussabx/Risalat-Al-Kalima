import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { ArrowLeftIcon } from '@/components/icons';
import { PostImage } from '@/components/PostImage';
import { PostMeta } from '@/components/PostMeta';
import { Reveal } from '@/components/Reveal';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { RULED_ITEM } from './styles';

/**
 * Editorial opening: the lead story as a large photograph with its text card
 * overlapping it (beside it on desktop, below it on mobile), followed by the
 * «الأحدث» rail of the next newest articles.
 */
export function HomeHero({ lead, rail }: { lead: ArticleSummary; rail: ArticleSummary[] }) {
  const href = routes.article(lead.slug);
  const category = lead.categories[0];

  return (
    <div className="container-site pt-6 sm:pt-10">
      <article aria-labelledby="home-lead-title" className="group relative grid items-center lg:grid-cols-12">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="block rounded-[1.25rem] shadow-(--shadow-card) lg:col-start-1 lg:col-end-8 lg:row-start-1"
        >
          <PostImage
            image={lead.image}
            priority
            zoom
            sizes="(min-width: 1280px) 690px, (min-width: 1024px) 58vw, 100vw"
            ratio="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] xl:aspect-[16/11]"
            className="rounded-[1.25rem]"
          />
        </Link>

        <div className="relative z-10 mx-3 -mt-14 animate-fade-up rounded-[1.25rem] border border-line bg-surface p-6 shadow-(--shadow-lift) sm:mx-8 sm:-mt-20 sm:p-8 lg:col-start-7 lg:col-end-13 lg:row-start-1 lg:m-0 lg:p-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {category ? <CategoryBadge category={category} /> : null}
            {lead.sticky ? <span className="eyebrow">اختيار هيئة التحرير</span> : null}
          </div>
          <h2 id="home-lead-title" className="mt-4 text-[1.625rem] leading-[1.45] font-bold text-ink sm:text-h1 xl:text-[2.5rem] xl:leading-[1.35]">
            <Link href={href} className="transition-colors hover:text-brand-700">
              {lead.title}
            </Link>
          </h2>
          {lead.excerpt ? <p className="mt-4 line-clamp-3 text-base leading-[1.9] text-muted sm:text-[1.0625rem]">{lead.excerpt}</p> : null}
          <PostMeta article={lead} avatar avatarSize={40} readingTime className="mt-6" />
          <Link href={href} className="btn-primary mt-7 min-h-12 px-6">
            اقرأ المقال
            <span className="sr-only">: {lead.title}</span>
            <ArrowLeftIcon width={18} height={18} />
          </Link>
        </div>
      </article>

      {rail.length ? (
        <Reveal className="mt-10 sm:mt-12">
          <section aria-labelledby="home-rail-title" className="card px-5 py-6 sm:px-8 sm:py-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="home-rail-title" className="flex items-center gap-2.5 text-h3 font-bold text-ink sm:text-h2">
                <span className="size-2.5 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-100" aria-hidden="true" />
                الأحدث
              </h2>
              <Link href={routes.articles()} className="group/link inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                كل المقالات
                <ArrowLeftIcon width={16} height={16} className="transition-transform duration-200 group-hover/link:-translate-x-1" />
              </Link>
            </div>
            <ul className="-my-5 grid gap-x-10 md:grid-cols-2">
              {rail.map((article) => (
                <li key={article.id} className={RULED_ITEM}>
                  <ArticleCard article={article} variant="horizontal" />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}
