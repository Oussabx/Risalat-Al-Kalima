import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArchiveView } from '@/components/ArchiveView';
import { decodeSlug, normalizeArabic } from '@/lib/arabic';
import { content } from '@/lib/content';
import { parsePage, parseSort, type SearchParams } from '@/lib/params';
import { routes } from '@/lib/routes';
import { booksCategoryNames, mediaCategoryNames } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const term = await content.getCategoryBySlug(decodeSlug((await params).slug));
  if (!term) return {};
  return {
    title: term.name,
    description: term.description || `مقالات قسم ${term.name} في مجلّة رسالة الكلمة.`,
    alternates: { canonical: routes.category(term.slug) },
  };
}

const isIn = (name: string, list: string[]) => list.some((n) => normalizeArabic(n) === normalizeArabic(name));

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const term = await content.getCategoryBySlug(decodeSlug((await params).slug));
  if (!term) notFound();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const sort = parseSort(sp.sort);
  const result = await content.getPosts({ categoryId: term.id, page, sort, perPage: 12 });
  const video = isIn(term.name, mediaCategoryNames);
  const books = isIn(term.name, booksCategoryNames);

  return (
    <ArchiveView
      crumbs={[{ label: 'المقالات', href: routes.articles() }, { label: term.name }]}
      eyebrow={video ? 'فيديو ووسائط' : books ? 'مكتبة المجلّة' : 'قسم'}
      title={term.name}
      description={term.description}
      result={result}
      video={video}
      featureFirst={sort === 'newest' && !video}
      hrefFor={(p) => routes.category(term.slug, { sort: sort === 'newest' ? undefined : sort, page: p })}
      controls={{}}
    />
  );
}
