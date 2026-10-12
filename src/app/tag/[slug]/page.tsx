import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArchiveHeader, HeaderIcon } from '@/components/archive/ArchiveHeader';
import { ArchiveToolbar, pageOf } from '@/components/archive/ArchiveToolbar';
import { ArticleGrid } from '@/components/archive/ArticleGrid';
import { archiveMetadata } from '@/components/archive/metadata';
import { OutOfRange } from '@/components/archive/OutOfRange';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeftIcon } from '@/components/icons';
import { Pagination } from '@/components/Pagination';
import { articlesLabel, decodeSlug } from '@/lib/arabic';
import { getTag, listArticles } from '@/lib/content';
import { parsePage, routes } from '@/lib/routes';
import { PAGE_SIZE, site } from '@/lib/site';

export const revalidate = 600;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function readView({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  return { slug: decodeSlug(slug), page: parsePage(sp.page) };
}

/** Shared by generateMetadata and the page, so each view is fetched once per request. */
const loadArticles = cache((tagId: number, page: number) => listArticles({ tagId, page, perPage: PAGE_SIZE }));

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, page } = await readView(props);
  const tag = await getTag(slug);
  if (!tag) return { title: 'الوسم غير موجود', robots: { index: false } };
  const data = await loadArticles(tag.id, page);
  return archiveMetadata({
    title: `وسم: ${tag.name}`,
    description: tag.description || `مقالات موسومة بـ«${tag.name}» في ${site.fullName}.`,
    path: routes.tag(tag.slug, { page }),
    page,
    noindex: page > 1 && !data.items.length,
  });
}

export default async function TagPage(props: Props) {
  const { slug, page } = await readView(props);
  const tag = await getTag(slug);
  if (!tag) notFound();

  const data = await loadArticles(tag.id, page);
  const outOfRange = page > 1 && data.items.length === 0;
  const position = pageOf(page, data.totalPages);

  return (
    <>
      <ArchiveHeader
        breadcrumbs={[{ label: 'المقالات', href: routes.articles() }, { label: `وسم: ${tag.name}` }]}
        title={`وسم: ${tag.name}`}
        description={tag.description || undefined}
        count={data.total || tag.count}
        media={
          <HeaderIcon>
            <span className="text-[1.75rem] leading-none font-bold">#</span>
          </HeaderIcon>
        }
      />

      <div className="container-site py-8 sm:py-10">
        {data.items.length && position ? (
          <ArchiveToolbar
            className="mb-8"
            summary={
              <>
                <strong className="font-semibold text-ink">{articlesLabel(data.total)}</strong>
                <span className="text-muted"> · {position}</span>
              </>
            }
          />
        ) : null}

        <section aria-label={`مقالات موسومة بـ«${tag.name}»`}>
          {outOfRange ? (
            <OutOfRange firstPageHref={routes.tag(tag.slug)} />
          ) : data.items.length ? (
            <ArticleGrid articles={data.items} label={`وسم ${tag.name}`} />
          ) : (
            <EmptyState
              title="لا توجد مقالات بهذا الوسم بعد"
              description="لم يُنشر أيّ مقال يحمل هذا الوسم حتّى الآن."
              action={
                <Link href={routes.articles()} className="btn-primary">
                  تصفّح كلّ المقالات
                  <ArrowLeftIcon width={16} height={16} />
                </Link>
              }
            />
          )}
        </section>

        {outOfRange ? null : <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => routes.tag(tag.slug, { page: p })} />}
      </div>
    </>
  );
}
