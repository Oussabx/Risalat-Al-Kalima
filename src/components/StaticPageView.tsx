import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { Page } from '@/lib/content/types';
import { prepareContent } from '@/lib/html';

/** Plain WordPress pages (anything published as a Page rather than a Post). */
export function StaticPageView({ page }: { page: Page }) {
  const { html } = prepareContent(page.contentHtml);
  return (
    <div className="container-page pt-6 sm:pt-8">
      <Breadcrumbs items={[{ label: page.title }]} />
      <div className="mx-auto mt-6 max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">{page.title}</h1>
        <div className="prose-ar mt-8" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
