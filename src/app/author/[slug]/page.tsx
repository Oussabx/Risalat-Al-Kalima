import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArchiveHeader } from '@/components/archive/ArchiveHeader';
import { ArchiveToolbar, pageOf } from '@/components/archive/ArchiveToolbar';
import { ArticleGrid } from '@/components/archive/ArticleGrid';
import { archiveMetadata } from '@/components/archive/metadata';
import { OutOfRange } from '@/components/archive/OutOfRange';
import { AuthorAvatar } from '@/components/AuthorAvatar';
import { EmptyState } from '@/components/EmptyState';
import { ArrowLeftIcon, UserIcon } from '@/components/icons';
import { JsonLd } from '@/components/JsonLd';
import { Pagination } from '@/components/Pagination';
import { articlesLabel, decodeSlug } from '@/lib/arabic';
import { getAuthor, listArticles } from '@/lib/content';
import { absoluteUrl, parsePage, routes } from '@/lib/routes';
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
const loadArticles = cache((authorId: number, page: number) => listArticles({ authorId, page, perPage: PAGE_SIZE }));

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, page } = await readView(props);
  const author = await getAuthor(slug);
  if (!author) return { title: 'الكاتب غير موجود', robots: { index: false } };
  const data = await loadArticles(author.id, page);
  return archiveMetadata({
    title: author.name,
    description: author.bio || `مقالات ${author.name} في ${site.fullName}.`,
    path: routes.author(author.slug, { page }),
    page,
    noindex: page > 1 && !data.items.length,
  });
}

export default async function AuthorPage(props: Props) {
  const { slug, page } = await readView(props);
  const author = await getAuthor(slug);
  if (!author) notFound();

  const data = await loadArticles(author.id, page);
  const outOfRange = page > 1 && data.items.length === 0;
  const position = pageOf(page, data.totalPages);
  const url = absoluteUrl(routes.author(author.slug), site.url);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          url,
          inLanguage: 'ar',
          mainEntity: {
            '@type': 'Person',
            name: author.name,
            url,
            ...(author.bio ? { description: author.bio } : {}),
            ...(author.avatar ? { image: author.avatar } : {}),
          },
        }}
      />
      <ArchiveHeader
        breadcrumbs={[{ label: 'المقالات', href: routes.articles() }, { label: author.name }]}
        eyebrow="بقلم"
        title={author.name}
        description={author.bio || undefined}
        count={outOfRange ? undefined : data.total}
        media={<AuthorAvatar author={author} size={96} className="shadow-(--shadow-card) ring-4!" />}
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

        <section aria-label={`مقالات ${author.name}`}>
          {outOfRange ? (
            <OutOfRange firstPageHref={routes.author(author.slug)} />
          ) : data.items.length ? (
            <ArticleGrid articles={data.items} label={`مقالات ${author.name}`} />
          ) : (
            <EmptyState
              icon={<UserIcon width={26} height={26} />}
              title="لا توجد مقالات منشورة بعد"
              description={`لم يُنشر لـ${author.name} أيّ مقال حتّى الآن.`}
              action={
                <Link href={routes.articles()} className="btn-primary">
                  تصفّح كلّ المقالات
                  <ArrowLeftIcon width={16} height={16} />
                </Link>
              }
            />
          )}
        </section>

        {outOfRange ? null : <Pagination page={page} totalPages={data.totalPages} hrefFor={(p) => routes.author(author.slug, { page: p })} />}
      </div>
    </>
  );
}
