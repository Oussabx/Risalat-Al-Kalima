import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArchiveView } from '@/components/ArchiveView';
import { AuthorAvatar } from '@/components/AuthorAvatar';
import { decodeSlug } from '@/lib/arabic';
import { content } from '@/lib/content';
import { parsePage, parseSort, type SearchParams } from '@/lib/params';
import { routes } from '@/lib/routes';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const author = await content.getAuthorBySlug(decodeSlug((await params).slug));
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio || `مقالات ${author.name} في مجلّة رسالة الكلمة.`,
    alternates: { canonical: routes.author(author.slug) },
  };
}

export default async function AuthorPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const author = await content.getAuthorBySlug(decodeSlug((await params).slug));
  if (!author) notFound();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const sort = parseSort(sp.sort);
  const result = await content.getPosts({ authorId: author.id, page, sort, perPage: 12 });

  const jsonLd = { '@context': 'https://schema.org', '@type': 'Person', name: author.name, description: author.bio, image: author.avatar };

  return (
    <>
      <ArchiveView
        crumbs={[{ label: 'الكتّاب' }, { label: author.name }]}
        eyebrow="كاتب في المجلّة"
        title={author.name}
        media={<AuthorAvatar author={author} size="xl" className="shadow-[var(--shadow-card)]" />}
        description={author.bio}
        result={result}
        featureFirst={false}
        hrefFor={(p) => routes.author(author.slug, { sort: sort === 'newest' ? undefined : sort, page: p })}
        controls={{}}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
