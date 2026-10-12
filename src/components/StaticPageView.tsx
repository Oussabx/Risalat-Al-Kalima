import type { PageContent } from '@/lib/content/types';
import { prepareContent } from '@/lib/html';
import { Breadcrumbs } from './Breadcrumbs';
import { PostImage } from './PostImage';

/** A WordPress page (not an article) rendered in the article reading style. */
export function StaticPageView({ page }: { page: PageContent }) {
  const { html } = prepareContent(page.contentHtml);
  return (
    <article className="bg-surface pt-6 pb-16 sm:pt-8 sm:pb-20">
      <div className="container-site">
        <Breadcrumbs items={[{ label: page.title }]} />
        <div className="mx-auto mt-8 max-w-[46rem] sm:mt-12">
          <header>
            <h1 className="text-h1 font-bold text-ink sm:text-[2.5rem] sm:leading-[1.4]">{page.title}</h1>
            <span className="mt-4 block h-1 w-14 rounded-full bg-brand-500" aria-hidden="true" />
          </header>
          {page.image ? (
            <PostImage
              image={page.image}
              sizes="(min-width: 800px) 736px, calc(100vw - 2rem)"
              priority
              ratio="aspect-[16/9]"
              className="mt-8 rounded-(--radius-card) sm:mt-10"
            />
          ) : null}
          {html.trim() ? <div className="prose-ar mt-8 sm:mt-10" dangerouslySetInnerHTML={{ __html: html }} /> : null}
        </div>
      </div>
    </article>
  );
}
