import type { Article } from '@/lib/content/types';
import { CategoryBadge } from '../CategoryBadge';
import { PostImage } from '../PostImage';
import { PostMeta } from '../PostMeta';

/**
 * Article header card: the featured image with a dark bottom gradient and the
 * category, title (the page's h1) and author over it. Without an image it
 * becomes a calm light-blue header with dark text.
 *
 * The card keeps its aspect ratio as a minimum: `overflow-clip` (unlike
 * `overflow-hidden`) lets it grow when a long title needs more room.
 */
export function ArticleHero({ article }: { article: Article }) {
  const category = article.categories[0];

  if (!article.image) {
    return (
      <header className="rounded-(--radius-card) border border-brand-100 bg-gradient-to-bl from-brand-50 to-brand-100 px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        {category ? <CategoryBadge category={category} className="mb-4" /> : null}
        <h1 className="max-w-4xl text-h1 font-bold text-ink sm:text-[2.5rem] sm:leading-[1.4]">{article.title}</h1>
        <PostMeta article={article} avatar avatarSize={36} className="mt-5" />
      </header>
    );
  }

  return (
    <header className="relative isolate flex aspect-[4/3] flex-col justify-end overflow-clip rounded-(--radius-card) bg-ink shadow-(--shadow-card) sm:aspect-[16/9] lg:aspect-[21/9] print:aspect-auto print:bg-transparent print:shadow-none">
      <div className="absolute inset-0 -z-10 print:hidden">
        <PostImage
          image={article.image}
          sizes="(min-width: 1240px) 1176px, (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)"
          priority
          ratio="h-full"
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/0 print:hidden" />
      <div className="p-5 pt-16 sm:p-8 sm:pt-20 lg:p-10 print:p-0">
        {category ? <CategoryBadge category={category} className="mb-3 sm:mb-4" /> : null}
        <h1 className="max-w-4xl text-h1 font-bold text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.25)] sm:text-[2.5rem] sm:leading-[1.4] print:text-black">
          {article.title}
        </h1>
        <PostMeta article={article} tone="light" avatar avatarSize={36} className="mt-4 print:text-black" />
      </div>
    </header>
  );
}
