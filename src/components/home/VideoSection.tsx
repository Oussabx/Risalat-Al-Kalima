import Link from 'next/link';
import { PlayIcon } from '@/components/icons';
import { PostImage } from '@/components/PostImage';
import { PostMeta } from '@/components/PostMeta';
import type { ArticleSummary, Category } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { HomeSection } from './HomeSection';
import { CARD_SHELL, cardRowClass, cardRowItemClass, STRETCHED_LINK } from './styles';

/** Articles from the video category (only rendered when it has articles). */
export function VideoSection({ category, articles }: { category: Category; articles: ArticleSummary[] }) {
  return (
    <HomeSection id="home-video" title={category.name} description={category.description || undefined} href={routes.category(category.slug)}>
      <ul className={cardRowClass(articles.length, articles.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
        {articles.map((article) => (
          <li key={article.id} className={cardRowItemClass(articles.length)}>
            <VideoCard article={article} />
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}

function VideoCard({ article }: { article: ArticleSummary }) {
  return (
    <article className={`${CARD_SHELL} flex h-full flex-col`}>
      <div className="relative">
        <PostImage image={article.image} sizes="(min-width: 1280px) 380px, (min-width: 1024px) 31vw, (min-width: 640px) 50vw, 100vw" ratio="aspect-video" zoom />
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors duration-300 group-hover:bg-black/25" aria-hidden="true">
          <span className="flex size-14 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
            <PlayIcon width={24} height={24} />
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-[1.0625rem] leading-[1.65] font-bold text-ink transition-colors group-hover:text-brand-700">
          <Link href={routes.article(article.slug)} className={STRETCHED_LINK}>
            {article.title}
          </Link>
        </h3>
        <PostMeta article={article} className="mt-auto pt-4" />
      </div>
    </article>
  );
}
