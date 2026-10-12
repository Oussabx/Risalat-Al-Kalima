import Link from 'next/link';
import type { ArticleSummary, Author } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { ArticleCard } from '../ArticleCard';
import { AuthorAvatar } from '../AuthorAvatar';
import { ArrowLeftIcon } from '../icons';

/** "بقلم" box after the article: the author, their bio when WordPress has one, and more of their articles. */
export function AuthorBox({ author, more }: { author: Author; more: ArticleSummary[] }) {
  const archive = author.slug ? routes.author(author.slug) : null;
  return (
    <section aria-labelledby="author-box-title" className="card p-5 sm:p-7">
      <div className="flex items-start gap-4 sm:gap-5">
        <AuthorAvatar author={author} size={72} />
        <div className="min-w-0 flex-1">
          <p className="meta">بقلم</p>
          <h2 id="author-box-title" className="text-h3 font-bold text-ink sm:text-[1.25rem]">
            {archive ? (
              <Link href={archive} className="transition-colors hover:text-brand-700">
                {author.name}
              </Link>
            ) : (
              author.name
            )}
          </h2>
          {author.bio ? <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{author.bio}</p> : null}
          {archive ? (
            <Link href={archive} className="group mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
              كل مقالات الكاتب
              <ArrowLeftIcon width={16} height={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
          ) : null}
        </div>
      </div>

      {more.length ? (
        <div className="mt-5 border-t border-line pt-5">
          <h3 className="mb-4 text-sm font-semibold text-muted">مقالات أخرى للكاتب</h3>
          <ul className="grid gap-5">
            {more.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} variant="horizontal" headingLevel={4} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
