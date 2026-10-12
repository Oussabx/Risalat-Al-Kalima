import Link from 'next/link';
import type { ReactNode } from 'react';
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
  const { author } = article;
  const sepClass = tone === 'light' ? 'text-white/50' : 'text-line-strong';
  /** Each «|» stays on the same line as the item it introduces, so a wrap never leaves it dangling. */
  const withSep = (node: ReactNode) => (
    <span className="inline-flex items-center gap-x-2.5 whitespace-nowrap">
      <span aria-hidden="true" className={sepClass}>
        |
      </span>
      {node}
    </span>
  );
  // An article without a usable author record shows no byline (never a substitute name).
  const authorName = !author.name ? null : linkAuthor && author.slug ? (
    // The pseudo-element widens the touch target to 44px without moving the text.
    <Link
      href={routes.author(author.slug)}
      className={`relative z-10 font-medium after:absolute after:-inset-x-1 after:-inset-y-3 ${strong} transition-colors hover:text-brand-600 ${tone === 'light' ? 'hover:text-white hover:underline' : ''}`}
    >
      {author.name}
    </Link>
  ) : (
    <span className={`font-medium ${strong}`}>{author.name}</span>
  );
  const date = <time dateTime={isoDate(article.date)}>{formatDate(article.date)}</time>;
  const reading = readingTime && article.readingMinutes > 0 ? <span>{minutesLabel(article.readingMinutes)} قراءة</span> : null;

  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-meta ${muted} ${className}`}>
      {avatar && authorName ? <AuthorAvatar author={author} size={avatarSize} /> : null}
      {authorName}
      {authorName ? withSep(date) : date}
      {reading ? withSep(reading) : null}
    </div>
  );
}
