import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { ArchiveHeader, HeaderIcon } from '@/components/archive/ArchiveHeader';
import { ArchiveToolbar, pageOf } from '@/components/archive/ArchiveToolbar';
import { ArticleGrid } from '@/components/archive/ArticleGrid';
import { archiveMetadata } from '@/components/archive/metadata';
import { OutOfRange } from '@/components/archive/OutOfRange';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeftIcon, BookmarkIcon } from '@/components/icons';
import { Pagination } from '@/components/Pagination';
import { articlesLabel } from '@/lib/arabic';
import { listArticles } from '@/lib/content';
import { parsePage, routes } from '@/lib/routes';
import { PAGE_SIZE } from '@/lib/site';

export const revalidate = 600;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TITLE = 'مختارات المحرّر';
/** Honest wording: the selection is editorial (WordPress sticky posts), not based on readership. */
const DESCRIPTION = 'مقالات اختارتها هيئة تحرير المجلّة وثبّتتها في واجهة الموقع. هذا الاختيار تحريريّ، ولا يعتمد على عدد القراءات.';

const pageHref = (page: number) => (page > 1 ? `${routes.picks()}?page=${page}` : routes.picks());

/** Shared by generateMetadata and the page, so each page is fetched once per request. */
const loadPicks = cache((page: number) => listArticles({ sticky: true, page, perPage: PAGE_SIZE }));

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const data = await loadPicks(page);
  return archiveMetadata({ title: TITLE, description: DESCRIPTION, path: pageHref(page), page, noindex: page > 1 && !data.items.length });
}

export default async function PicksPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).page);
  const data = await loadPicks(page);
  const outOfRange = page > 1 && data.items.length === 0;
  const position = pageOf(page, data.totalPages);

  return (
    <>
      <ArchiveHeader
        breadcrumbs={[{ label: TITLE }]}
        eyebrow="اختيار هيئة التحرير"
        title={TITLE}
        description={DESCRIPTION}
        count={data.items.length ? data.total : undefined}
        media={
          <HeaderIcon>
            <BookmarkIcon filled width={26} height={26} />
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

        <section aria-label={TITLE}>
          {outOfRange ? (
            <OutOfRange firstPageHref={routes.picks()} />
          ) : data.items.length ? (
            <ArticleGrid articles={data.items} label={TITLE} />
          ) : (
            <EmptyState
              icon={<BookmarkIcon width={26} height={26} />}
              title="لا توجد مختارات حاليًّا"
              description="لم تثبّت هيئة التحرير أيّ مقال في الوقت الحاليّ. يمكنك تصفّح أحدث المقالات إلى حين ذلك."
              action={
                <Link href={routes.articles()} className="btn-primary">
                  أحدث المقالات
                  <ArrowLeftIcon width={16} height={16} />
                </Link>
              }
            />
          )}
        </section>

        {outOfRange ? null : <Pagination page={page} totalPages={data.totalPages} hrefFor={pageHref} />}
      </div>
    </>
  );
}
