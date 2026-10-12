import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArchiveHeader, HeaderIcon } from '@/components/archive/ArchiveHeader';
import { ArchiveResults } from '@/components/archive/ArchiveResults';
import { ArchiveToolbar, pageOf } from '@/components/archive/ArchiveToolbar';
import { archiveKind, categoryGroupOf } from '@/components/archive/kinds';
import { archiveMetadata } from '@/components/archive/metadata';
import { OutOfRange } from '@/components/archive/OutOfRange';
import { RelatedCategories } from '@/components/archive/RelatedCategories';
import { SortControl } from '@/components/archive/SortControl';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeftIcon, BookIcon, PlayIcon } from '@/components/icons';
import { Pagination } from '@/components/Pagination';
import { articlesLabel, decodeSlug } from '@/lib/arabic';
import { getCategoryBySlug, listArticles, resolveCategories } from '@/lib/content';
import type { Category, SortOrder } from '@/lib/content/types';
import { parsePage, parseSort, routes } from '@/lib/routes';
import { PAGE_SIZE, site } from '@/lib/site';

export const revalidate = 600;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function readView({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  return { slug: decodeSlug(slug), sort: parseSort(sp.sort), page: parsePage(sp.page) };
}

/** Shared by generateMetadata and the page, so each view is fetched once per request. */
const loadArticles = cache((categoryId: number, sort: SortOrder, page: number) =>
  listArticles({ categoryIds: [categoryId], page, perPage: PAGE_SIZE, order: sort }),
);

/** Other categories of the same menu group that have articles. */
async function siblingsOf(category: Category): Promise<{ title?: string; categories: Category[] }> {
  const group = categoryGroupOf(category.name);
  if (!group) return { categories: [] };
  const found = await resolveCategories(group.names);
  return { title: group.title, categories: found.filter((c) => c.id !== category.id && c.count > 0) };
}

function describe(category: Category): string {
  return category.description || `مقالات قسم «${category.name}» في ${site.fullName}.`;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, sort, page } = await readView(props);
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'القسم غير موجود', robots: { index: false } };
  const data = await loadArticles(category.id, sort, page);
  return archiveMetadata({
    title: category.name,
    description: describe(category),
    path: routes.category(category.slug, { page }),
    page,
    noindex: page > 1 && !data.items.length,
  });
}

export default async function CategoryPage(props: Props) {
  const { slug, sort, page } = await readView(props);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [data, siblings] = await Promise.all([loadArticles(category.id, sort, page), siblingsOf(category)]);
  const kind = archiveKind(category.name);
  const outOfRange = page > 1 && data.items.length === 0;
  const position = pageOf(page, data.totalPages);
  const href = (change: { sort?: SortOrder; page?: number }) => routes.category(category.slug, { sort, page: undefined, ...change });

  return (
    <>
      <ArchiveHeader
        breadcrumbs={[{ label: 'المقالات', href: routes.articles() }, { label: category.name }]}
        eyebrow={siblings.title ?? 'قسم'}
        title={category.name}
        description={category.description || undefined}
        count={data.total || category.count}
        media={
          kind === 'media' ? (
            <HeaderIcon>
              <PlayIcon width={26} height={26} />
            </HeaderIcon>
          ) : kind === 'books' ? (
            <HeaderIcon>
              <BookIcon width={28} height={28} />
            </HeaderIcon>
          ) : undefined
        }
      />

      <div className="container-site py-8 sm:py-10">
        {data.items.length ? (
          <ArchiveToolbar
            summary={
              <>
                <strong className="font-semibold text-ink">{articlesLabel(data.total)}</strong>
                {position ? <span className="text-muted"> · {position}</span> : null}
              </>
            }
          >
            <SortControl current={sort} hrefFor={(s) => href({ sort: s })} />
          </ArchiveToolbar>
        ) : null}

        <section aria-label={`مقالات ${category.name}`} className={data.items.length ? 'mt-8' : undefined}>
          {outOfRange ? (
            <OutOfRange firstPageHref={href({})} />
          ) : data.items.length ? (
            <ArchiveResults kind={kind} articles={data.items} featured={page === 1 && sort === 'newest' && data.items.length > 2} featuredLabel="الأحدث في هذا القسم" label={category.name} />
          ) : (
            <EmptyState
              icon={kind === 'media' ? <PlayIcon width={24} height={24} /> : undefined}
              title="لا توجد مقالات في هذا القسم بعد"
              description="لم يُنشر في هذا القسم أيّ مقال حتّى الآن. يمكنك تصفّح أحدث المقالات أو الأقسام ذات الصلة."
              action={
                <Link href={routes.articles()} className="btn-primary">
                  تصفّح كلّ المقالات
                  <ArrowLeftIcon width={16} height={16} />
                </Link>
              }
            />
          )}
        </section>

        {outOfRange ? null : <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => href({ page: p })} />}

        <RelatedCategories categories={siblings.categories} groupTitle={siblings.title} />
      </div>
    </>
  );
}
