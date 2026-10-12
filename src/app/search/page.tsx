import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { ArchiveHeader } from '@/components/archive/ArchiveHeader';
import { pageOf } from '@/components/archive/ArchiveToolbar';
import { CategoryFilter } from '@/components/archive/CategoryFilter';
import { isUncategorized } from '@/components/archive/kinds';
import { OutOfRange } from '@/components/archive/OutOfRange';
import { EmptyState } from '@/components/EmptyState';
import { AlertIcon, ArrowLeftIcon } from '@/components/icons';
import { Pagination } from '@/components/Pagination';
import { BrowseCategories } from '@/components/search/BrowseCategories';
import { resultsLabel } from '@/components/search/hits';
import { SearchForm } from '@/components/search/SearchForm';
import { SearchNoResults } from '@/components/search/SearchNoResults';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { isPreview } from '@/lib/content';
import { parsePage, parseString, routes } from '@/lib/routes';
import { runSearch, type SearchResult } from '@/lib/search-service';
import { PAGE_SIZE } from '@/lib/site';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const DESCRIPTION = 'ابحث في عناوين المقالات وأسماء الكتّاب والأقسام والوسوم ونصوص المقالات. لا فرق بين الهمزات أو التشكيل في البحث.';

/**
 * Reads the view from the URL. Old WordPress search links (/?s=…) arrive here
 * still carrying `s` (next.config.ts keeps unmatched query keys), so any `s`
 * is folded into `q` with one redirect to the clean URL. Called first by both
 * generateMetadata and the page, so the redirect happens as early as possible.
 */
async function readView(searchParams: Props['searchParams']) {
  const sp = await searchParams;
  const view = { q: (parseString(sp.q) || parseString(sp.s)).slice(0, 100), category: parseString(sp.category), page: parsePage(sp.page) };
  if (sp.s !== undefined) permanentRedirect(routes.search({ q: view.q, category: view.category || undefined, page: view.page }));
  return view;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await readView(searchParams);
  return {
    title: q ? `نتائج البحث عن «${q}»` : 'البحث',
    description: DESCRIPTION,
    alternates: { canonical: routes.search() },
    robots: { index: false, follow: !isPreview },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, category, page } = await readView(searchParams);

  let result: SearchResult | null = null;
  let failed = false;
  if (q) {
    try {
      result = await runSearch(q, { page, perPage: PAGE_SIZE, category: category || undefined });
    } catch (error) {
      console.error('[search page]', (error as Error).message);
      failed = true;
    }
  }

  return (
    <>
      <ArchiveHeader breadcrumbs={[{ label: 'البحث' }]} title="البحث في المجلّة" description={q ? undefined : DESCRIPTION}>
        <SearchForm
          id="search-page-q"
          action={routes.search()}
          q={q}
          label="ابحث في المجلّة"
          placeholder="ابحث عن مقال أو كاتب أو موضوع…"
          clearHref={routes.search()}
          size="lg"
          autoFocus={!q}
          className="max-w-3xl"
        />
      </ArchiveHeader>

      <div className="container-site py-8 sm:py-10">
        {!q ? (
          <BrowseCategories description="أو ابدأ من أحد أقسام المجلّة." />
        ) : failed || !result ? (
          <EmptyState
            icon={<AlertIcon width={26} height={26} />}
            title="تعذّر إجراء البحث الآن"
            description="حدث خطأ أثناء الاتصال بمصدر المقالات. حاول مجدّدًا بعد لحظات."
            action={
              <>
                {/* A full reload, so the retry also works without JavaScript and bypasses the router cache. */}
                <a href={routes.search({ q, category: category || undefined, page })} className="btn-primary">
                  إعادة المحاولة
                </a>
                <Link href={routes.articles()} className="btn-outline">
                  تصفّح المقالات
                  <ArrowLeftIcon width={16} height={16} />
                </Link>
              </>
            }
          />
        ) : (
          <SearchResults q={q} category={category} page={page} result={result} />
        )}
      </div>
    </>
  );
}

function SearchResults({ q, category, page, result }: { q: string; category: string; page: number; result: SearchResult }) {
  const facets = result.facets.filter((f) => !isUncategorized(f));
  const active = category ? facets.find((f) => f.slug === category) : undefined;
  const showFacets = facets.length > 1 || Boolean(category);
  const facetRow = showFacets ? (
    <CategoryFilter
      className="mt-5"
      label="تصفية النتائج حسب القسم"
      options={facets}
      current={category || undefined}
      hrefFor={(slug) => routes.search({ q, category: slug })}
    />
  ) : null;

  // Nothing anywhere (a category filter only narrows results that exist elsewhere).
  if (!result.total && (!category || !facets.length)) {
    return (
      <div className="space-y-8">
        <SearchNoResults query={q} />
        <BrowseCategories />
      </div>
    );
  }

  const position = pageOf(page, result.totalPages);
  return (
    <section aria-labelledby="search-results-title">
      <h2 id="search-results-title" className="text-h2 font-bold text-ink [overflow-wrap:anywhere]">
        {result.total ? resultsLabel(result.total) : 'لا نتائج'} لـ «<bdi>{q}</bdi>»{active ? ` في «${active.name}»` : ''}
      </h2>
      {position ? <p className="mt-1 text-sm text-muted">{position}</p> : null}
      {facetRow}

      <div className="mt-6">
        {!result.total ? (
          <EmptyState
            title="لا نتائج في هذا القسم"
            description="لم نجد ما يطابق بحثك في هذا القسم، لكن توجد نتائج في أقسام أخرى."
            action={
              <Link href={routes.search({ q })} className="btn-primary">
                عرض كلّ النتائج
                <ArrowLeftIcon width={16} height={16} />
              </Link>
            }
          />
        ) : !result.items.length ? (
          <OutOfRange firstPageHref={routes.search({ q, category: category || undefined })} />
        ) : (
          <ol role="list" start={(page - 1) * PAGE_SIZE + 1} className="card divide-y divide-line px-4 sm:px-6">
            {result.items.map((article, i) => (
              <li key={article.id} className="py-5 sm:py-6">
                <SearchResultCard article={article} query={q} priority={i < 2} />
              </li>
            ))}
          </ol>
        )}
      </div>

      {result.items.length ? <Pagination page={page} totalPages={result.totalPages} hrefFor={(p) => routes.search({ q, category: category || undefined, page: p })} /> : null}
    </section>
  );
}
