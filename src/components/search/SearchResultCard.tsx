import Link from 'next/link';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { PostImage } from '../PostImage';
import { PostMeta } from '../PostMeta';
import { highlight } from './highlight';

/** Horizontal search result: thumbnail, category, title and excerpt with the query's words marked, meta. */
export function SearchResultCard({ article, query, priority = false }: { article: ArticleSummary; query: string; priority?: boolean }) {
  const category = article.categories[0];
  return (
    <article className="group relative flex items-start gap-4 sm:gap-6">
      <PostImage
        image={article.image}
        sizes="(min-width: 640px) 192px, 96px"
        ratio="aspect-[4/3]"
        className="w-24 shrink-0 rounded-xl sm:w-48"
        priority={priority}
        zoom
      />
      <div className="min-w-0 flex-1">
        {category ? (
          <Link href={routes.category(category.slug)} className="eyebrow relative z-10 mb-1 inline-block hover:text-brand-800 hover:underline">
            {category.name}
          </Link>
        ) : null}
        <h3 className="text-[1.0625rem] leading-[1.65] font-bold text-ink transition-colors group-hover:text-brand-700 sm:text-lg">
          <Link href={routes.article(article.slug)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {highlight(article.title, query)}
          </Link>
        </h3>
        {article.excerpt ? <p className="mt-1.5 line-clamp-2 text-sm leading-[1.85] text-muted sm:line-clamp-3">{highlight(article.excerpt, query)}</p> : null}
        <PostMeta article={article} className="mt-2.5" />
      </div>
    </article>
  );
}
