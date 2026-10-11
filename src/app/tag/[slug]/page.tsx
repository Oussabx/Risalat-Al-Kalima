import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArchiveView } from '@/components/ArchiveView';
import { decodeSlug } from '@/lib/arabic';
import { content } from '@/lib/content';
import { parsePage, parseSort, type SearchParams } from '@/lib/params';
import { routes } from '@/lib/routes';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const term = await content.getTagBySlug(decodeSlug((await params).slug));
  if (!term) return {};
  return {
    title: `وسم: ${term.name}`,
    description: `مقالات موسومة بـ«${term.name}» في مجلّة رسالة الكلمة.`,
    alternates: { canonical: routes.tag(term.slug) },
  };
}

export default async function TagPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const term = await content.getTagBySlug(decodeSlug((await params).slug));
  if (!term) notFound();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const sort = parseSort(sp.sort);
  const result = await content.getPosts({ tagId: term.id, page, sort, perPage: 12 });

  return (
    <ArchiveView
      crumbs={[{ label: 'المقالات', href: routes.articles() }, { label: `#${term.name}` }]}
      eyebrow="وسم"
      title={`#${term.name}`}
      description={term.description}
      result={result}
      featureFirst={false}
      hrefFor={(p) => routes.tag(term.slug, { sort: sort === 'newest' ? undefined : sort, page: p })}
      controls={{}}
    />
  );
}
