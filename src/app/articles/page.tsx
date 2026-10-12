import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { ArchiveHeader } from '@/components/archive/ArchiveHeader';
import { ArchiveResults } from '@/components/archive/ArchiveResults';
import { ArchiveToolbar, pageOf } from '@/components/archive/ArchiveToolbar';
import { CategoryFilter } from '@/components/archive/CategoryFilter';
import { archiveKind, isUncategorized } from '@/components/archive/kinds';
import { archiveMetadata } from '@/components/archive/metadata';
import { OutOfRange } from '@/components/archive/OutOfRange';
import { SortControl } from '@/components/archive/SortControl';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeftIcon, SearchIcon } from '@/components/icons';
import { Pagination } from '@/components/Pagination';
import { SearchForm } from '@/components/search/SearchForm';
import { articlesLabel } from '@/lib/arabic';
import { getCategories, getCategoryBySlug, listArticles } from '@/lib/content';
import type { SortOrder } from '@/lib/content/types';
import { parsePage, parseSort, parseString, routes } from '@/lib/routes';
import { PAGE_SIZE } from '@/lib/site';

export const revalidate = 600;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type View = { q?: string; category?: string; sort?: SortOrder; page?: number };

const INTRO = 'كلّ ما نشرته المجلّة من مقالات وتأمّلات ودراسات، من الأحدث إلى الأقدم. ابحث بكلمة، أو اختر قسمًا، أو غيّر طريقة الترتيب.';

async function readView(searchParams: Props['searchParams']) {
  const sp = await searchParams;
  return { q: parseString(sp.q).slice(0, 100), categorySlug: parseString(sp.category), sort: parseSort(sp.sort), page: parsePage(sp.page) };
}

/** Shared by generateMetadata and the page, so each view is fetched once per request. */
const load = cache(async (q: string, categorySlug: string, sort: SortOrder, page: number) => {
  // An unknown category slug is ignored rather than turned into an error page.
  const category = categorySlug ? await getCategoryBySlug(categorySlug) : undefined;
  const data = await listArticles({ page, perPage: PAGE_SIZE, order: sort, search: q || undefined, categoryIds: category ? [category.id] : undefined });
  return { category, data };
});

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, categorySlug, sort, page } = await readView(searchParams);
  const { category, data } = await load(q, categorySlug, sort, page);
  return archiveMetadata({
    title: q ? `البحث في المقالات عن «${q}»` : category ? `المقالات: ${category.name}` : 'المقالات',
    description: INTRO,
    // A category filter lists exactly what its category archive lists.
    path: category && !q ? routes.category(category.slug, { page }) : routes.articles({ page: q ? undefined : page }),
    page,
    noindex: Boolean(q) || (page > 1 && !data.items.length),
  });
}

export default async function ArticlesPage({ searchParams }: Props) {
  const { q, categorySlug, sort, page } = await readView(searchParams);
  const [{ category, data }, categories] = await Promise.all([load(q, categorySlug, sort, page), getCategories()]);

  const current: View = { q: q || undefined, category: category?.slug, sort };
  const href = (change: View) => routes.articles({ ...current, page: undefined, ...change });

  const options = categories
    .filter((c) => (c.count > 0 || c.id === category?.id) && !isUncategorized(c))
    .sort((a, b) => b.count - a.count)
    .map(({ slug, name }) => ({ slug, name }));

  const filtered = Boolean(q || category);
  const outOfRange = page > 1 && data.items.length === 0;
  const featured = page === 1 && !filtered && sort === 'newest' && data.items.length > 2;
  const position = pageOf(page, data.totalPages);

  return (
    <>
      <ArchiveHeader breadcrumbs={[{ label: 'المقالات' }]} eyebrow="أرشيف المجلّة" title="المقالات" description={INTRO}>
        <SearchForm
          id="articles-search"
          action={routes.articles()}
          q={q}
          label="ابحث في المقالات"
          placeholder="ابحث في عناوين المقالات ونصوصها…"
          hidden={{ category: category?.slug, sort: sort === 'newest' ? undefined : sort }}
          clearHref={href({ q: undefined })}
          className="max-w-3xl"
        />
      </ArchiveHeader>

      <div className="container-site py-8 sm:py-10">
        {options.length ? <CategoryFilter options={options} current={category?.slug} hrefFor={(slug) => href({ category: slug })} /> : null}

        {data.items.length ? (
          <ArchiveToolbar
            className="mt-5"
            summary={
              <>
                {q ? (
                  <>
                    نتائج «<span className="font-semibold text-ink">{q}</span>»{category ? ` في قسم «${category.name}»` : ''}:{' '}
                  </>
                ) : category ? (
                  `قسم «${category.name}»: `
                ) : null}
                <strong className="font-semibold text-ink">{articlesLabel(data.total)}</strong>
                {position ? <span className="text-muted"> · {position}</span> : null}
              </>
            }
          >
            <SortControl current={sort} hrefFor={(s) => href({ sort: s })} />
          </ArchiveToolbar>
        ) : null}

        <section aria-label="قائمة المقالات" className="mt-8">
          {outOfRange ? (
            <OutOfRange firstPageHref={href({})} />
          ) : data.items.length ? (
            <ArchiveResults kind={archiveKind(category?.name)} articles={data.items} featured={featured} featuredLabel="الأحدث" label="المقالات" />
          ) : (
            <EmptyState
              icon={q ? <SearchIcon width={26} height={26} /> : undefined}
              title={filtered ? 'لا توجد مقالات مطابقة' : 'لا توجد مقالات بعد'}
              description={
                q
                  ? `لم نجد مقالات تطابق «${q}»${category ? ` في قسم «${category.name}»` : ''}. تحقّق من الإملاء، أو جرّب كلمات أقلّ، أو استخدم البحث الشامل الذي يشمل أسماء الكتّاب والوسوم.`
                  : category
                    ? `لم يُنشر في قسم «${category.name}» أيّ مقال بعد.`
                    : 'ستظهر المقالات هنا فور نشرها.'
              }
              action={
                filtered ? (
                  <>
                    {q ? (
                      <Link href={routes.search({ q })} className="btn-primary">
                        <SearchIcon width={16} height={16} />
                        البحث الشامل
                      </Link>
                    ) : null}
                    <Link href={routes.articles()} className={q ? 'btn-outline' : 'btn-primary'}>
                      عرض كلّ المقالات
                      <ArrowLeftIcon width={16} height={16} />
                    </Link>
                  </>
                ) : undefined
              }
            />
          )}
        </section>

        {outOfRange ? null : <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => href({ page: p })} />}
      </div>
    </>
  );
}
