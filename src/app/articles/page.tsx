import type { Metadata } from 'next';
import { ArchiveView } from '@/components/ArchiveView';
import { content, getCategories } from '@/lib/content';
import { one, parsePage, parseSort, type SearchParams } from '@/lib/params';
import { routes } from '@/lib/routes';
import { runSearch } from '@/lib/search-service';

export const metadata: Metadata = {
  title: 'المقالات',
  description: 'كل مقالات مجلّة رسالة الكلمة: تأمّلات، دراسات كتابيّة، الحياة والعائلة، التاريخ والثقافة.',
  alternates: { canonical: routes.articles() },
};

export default async function ArticlesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const sort = parseSort(sp.sort);
  const q = one(sp.q)?.trim() ?? '';
  const categorySlug = one(sp.category) ?? '';

  const categories = await getCategories();
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined;

  const result = q
    ? await runSearch(q, { page, categoryId: category?.id })
    : await content.getPosts({ page, sort, categoryId: category?.id, perPage: 12 });

  const params = { q: q || undefined, category: category?.slug, sort: sort === 'newest' ? undefined : sort };

  return (
    <ArchiveView
      crumbs={[{ label: 'المقالات' }]}
      eyebrow="أرشيف المجلّة"
      title={q ? `نتائج «${q}»` : category ? `المقالات: ${category.name}` : 'كل المقالات'}
      description="مقالات تتناول الموضوعات الروحيّة والأخلاقيّة والاجتماعيّة من وجهة نظر كتابيّة. صفِّ حسب القسم، أو رتّب، أو ابحث."
      result={result}
      featureFirst={!q && sort === 'newest'}
      hrefFor={(p) => routes.articles({ ...params, page: p })}
      controls={{
        showSearch: true,
        showCategory: true,
        categories: [...categories].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).map((c) => ({ slug: c.slug, name: c.name })),
      }}
    />
  );
}
