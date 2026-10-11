import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { EmptyState } from '@/components/ArchiveView';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination } from '@/components/Pagination';
import { SearchIcon } from '@/components/icons';
import { countArticles } from '@/lib/arabic';
import { categoriesByName, getCategories } from '@/lib/content';
import { one, parsePage, type SearchParams } from '@/lib/params';
import { routes } from '@/lib/routes';
import { runSearch } from '@/lib/search-service';
import { primaryCategoryNames } from '@/lib/site';

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = one((await searchParams).q)?.trim();
  return {
    title: q ? `بحث: ${q}` : 'البحث',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? '';
  const page = parsePage(sp.page);
  const categorySlug = one(sp.category) ?? '';
  const categories = await getCategories();
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined;
  const result = await runSearch(q, { page, categoryId: category?.id });
  const suggestions = await categoriesByName([...primaryCategoryNames, 'تاريخ وشخصيات', 'الكنيسة']);

  return (
    <div className="container-page pt-6 sm:pt-8">
      <Breadcrumbs items={[{ label: 'البحث' }]} />
      <h1 className="mt-5 text-3xl font-bold text-ink sm:text-4xl">{q ? <>نتائج البحث عن «{q}»</> : 'البحث في المجلّة'}</h1>

      <form role="search" action={routes.search()} className="relative mt-6 max-w-2xl">
        <label htmlFor="search-q" className="sr-only">
          كلمات البحث
        </label>
        <SearchIcon size={20} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-brand-600" />
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={q}
          autoFocus={!q}
          enterKeyHint="search"
          placeholder="ابحث عن مقال، كاتب، قسم أو وسم…"
          className="h-14 w-full rounded-2xl border border-line bg-white ps-12 pe-28 text-lg shadow-[var(--shadow-card)] outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <button type="submit" className="absolute end-2 top-2 h-10 rounded-xl bg-brand-600 px-5 font-semibold text-white transition hover:bg-brand-700">
          ابحث
        </button>
      </form>

      {q && (
        <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="تصفية حسب القسم">
          <p className="me-1 text-sm text-muted" role="status">
            {countArticles(result.total)}
          </p>
          {result.facets.length > 1 && (
            <>
              <FacetLink href={routes.search({ q })} active={!category}>
                الكل
              </FacetLink>
              {result.facets.map((f) => (
                <FacetLink key={f.id} href={routes.search({ q, category: f.slug })} active={category?.id === f.id}>
                  {f.name} <span className="opacity-60">({f.hits})</span>
                </FacetLink>
              ))}
            </>
          )}
          {category && (
            <Link href={routes.search({ q })} className="text-sm font-medium text-muted underline underline-offset-4 hover:text-ink">
              مسح التصفية
            </Link>
          )}
        </div>
      )}

      <div className="mt-8">
        {!q ? (
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <p className="font-semibold text-ink">ماذا تبحث عنه؟</p>
            <p className="mt-1 text-sm leading-7 text-muted">
              يبحث المحرّك في العناوين والمقتطفات وأسماء الكتّاب والأقسام والوسوم، ويتجاهل الحركات والشدّة واختلاف الهمزات.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {suggestions.map((c) => (
                <li key={c.id}>
                  <Link href={routes.category(c.slug)} className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : result.items.length === 0 ? (
          <EmptyState title={`لا توجد نتائج لـ «${q}»`}>
            تأكّد من الإملاء، أو جرّب كلمة أعمّ أو أقصر، أو{' '}
            <Link href={routes.articles()} className="font-medium text-brand-700 underline underline-offset-4">
              تصفّح كل المقالات
            </Link>
            .
          </EmptyState>
        ) : (
          <>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((post) => (
                <li key={post.id}>
                  <ArticleCard post={post} showExcerpt headingLevel={2} />
                </li>
              ))}
            </ul>
            <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(p) => routes.search({ q, category: category?.slug, page: p })} />
          </>
        )}
      </div>
    </div>
  );
}

function FacetLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'bg-brand-600 text-white' : 'border border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {children}
    </Link>
  );
}
