import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { ArrowLeftIcon, HomeIcon, SearchIcon } from '@/components/icons';
import { listArticles, type ArticleSummary } from '@/lib/content';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة',
  robots: { index: false, follow: true },
};

async function latest(): Promise<ArticleSummary[]> {
  try {
    return (await listArticles({ perPage: 4, order: 'newest' })).items;
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const articles = await latest();

  return (
    <div className="container-site py-14 sm:py-20">
      <section aria-labelledby="not-found-title" className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="text-[4.5rem] leading-none font-bold text-brand-200 tabular-nums sm:text-[6rem]" aria-hidden="true">
          404
        </p>
        <h1 id="not-found-title" className="mt-4 text-[1.75rem] leading-[1.45] font-bold text-ink sm:text-h1">
          لم نجد هذه الصفحة
        </h1>
        <p className="mt-3 max-w-lg text-base leading-[1.9] text-ink-soft">
          ربّما تغيّر عنوانها أو نُقلت. جرّب البحث عن المقال الذي تريده، أو عُد إلى الصفحة الرئيسيّة.
        </p>

        <form action={routes.search()} method="get" role="search" className="mt-8 flex w-full max-w-lg flex-col gap-2.5 sm:flex-row">
          <label htmlFor="not-found-q" className="sr-only">
            ابحث في المجلّة
          </label>
          <input id="not-found-q" name="q" type="search" required minLength={2} placeholder="ابحث عن مقال أو موضوع…" className="field min-w-0 flex-1" />
          <button type="submit" className="btn-primary min-h-12 px-6">
            <SearchIcon width={18} height={18} />
            ابحث
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={routes.home()} className="btn-outline min-h-11 px-5">
            <HomeIcon width={18} height={18} />
            الصفحة الرئيسيّة
          </Link>
          <Link href={routes.articles()} className="btn-ghost min-h-11 px-5">
            كلّ المقالات
            <ArrowLeftIcon width={18} height={18} />
          </Link>
        </div>
      </section>

      {articles.length ? (
        <section aria-labelledby="not-found-latest" className="mt-16 sm:mt-20">
          <h2 id="not-found-latest" className="flex items-center gap-3 text-h2 font-bold text-ink sm:text-[1.5rem]">
            <span className="h-6 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
            أحدث المقالات
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((article) => (
              <li key={article.id} className="flex">
                <ArticleCard article={article} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
