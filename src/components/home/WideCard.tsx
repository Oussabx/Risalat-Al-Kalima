import Link from 'next/link';
import { CategoryBadge } from '@/components/CategoryBadge';
import { PostImage } from '@/components/PostImage';
import { PostMeta } from '@/components/PostMeta';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { CARD_SHELL, STRETCHED_LINK } from './styles';

/** Wide card: image beside the text (stacked on phones), with a short excerpt. */
export function WideCard({ article, sizes }: { article: ArticleSummary; sizes?: string }) {
  const category = article.categories[0];
  return (
    <article className={`${CARD_SHELL} flex h-full flex-col sm:flex-row`}>
      <PostImage
        image={article.image}
        sizes={sizes ?? '(min-width: 1280px) 240px, (min-width: 1024px) 20vw, (min-width: 640px) 40vw, 100vw'}
        ratio="aspect-[16/10] sm:aspect-auto"
        className="sm:min-h-56 sm:w-[42%] sm:shrink-0"
        zoom
      />
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        {category ? <CategoryBadge category={category} tone="soft" className="self-start" /> : null}
        <h3 className="mt-3 text-lg leading-[1.6] font-bold text-ink transition-colors group-hover:text-brand-700">
          <Link href={routes.article(article.slug)} className={STRETCHED_LINK}>
            {article.title}
          </Link>
        </h3>
        {article.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{article.excerpt}</p> : null}
        <PostMeta article={article} className="mt-auto pt-4" />
      </div>
    </article>
  );
}
