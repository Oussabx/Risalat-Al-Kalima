import Link from 'next/link';
import { formatDate, isoDate, minutesLabel } from '@/lib/arabic';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { AuthorAvatar } from './AuthorAvatar';

/** "author | date" line used on cards and article headers. */
export function PostMeta({
  article,
  tone = 'default',
  avatar = false,
  avatarSize = 28,
  readingTime = false,
  linkAuthor = true,
  className = '',
}: {
  article: Pick<ArticleSummary, 'author' | 'date' | 'readingMinutes'>;
  tone?: 'default' | 'light';
  avatar?: boolean;
  avatarSize?: number;
  readingTime?: boolean;
  linkAuthor?: boolean;
  className?: string;
}) {
  const muted = tone === 'light' ? 'text-white/85' : 'text-muted';
  const strong = tone === 'light' ? 'text-white' : 'text-ink-soft';
  const sep = <span aria-hidden="true" className={tone === 'light' ? 'text-white/50' : 'text-line-strong'}>|</span>;
  const authorName =
    linkAuthor && article.author.slug ? (
      <Link href={routes.author(article.author.slug)} className={`relative z-10 font-medium ${strong} transition-colors hover:text-brand-600 ${tone === 'light' ? 'hover:text-white hover:underline' : ''}`}>
        {article.author.name}
      </Link>
    ) : (
      <span className={`font-medium ${strong}`}>{article.author.name}</span>
    );

  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-meta ${muted} ${className}`}>
      {avatar ? <AuthorAvatar author={article.author} size={avatarSize} /> : null}
      {authorName}
      {sep}
      <time dateTime={isoDate(article.date)}>{formatDate(article.date)}</time>
      {readingTime && article.readingMinutes > 0 ? (
        <>
          {sep}
          <span>{minutesLabel(article.readingMinutes)} قراءة</span>
        </>
      ) : null}
    </div>
  );
}
