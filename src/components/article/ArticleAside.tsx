import Link from 'next/link';
import { formatDate, isoDate, minutesLabel } from '@/lib/arabic';
import type { Article } from '@/lib/content/types';
import type { SavedItem } from '@/lib/client/saved';
import type { Heading } from '@/lib/html';
import { routes } from '@/lib/routes';
import { AuthorAvatar } from '../AuthorAvatar';
import { ClockIcon } from '../icons';
import { BookmarkButton } from './BookmarkButton';
import { InlineReadingProgress } from './ReadingProgress';
import { ShareButton } from './ShareButton';
import { TableOfContents } from './TableOfContents';

/**
 * Slim sticky sidebar on the end side (left in RTL) from `lg` up: bookmark and
 * share, the author, reading time, reading progress and the table of contents.
 */
export function ArticleAside({
  article,
  minutes,
  headings,
  saved,
  shareUrl,
}: {
  article: Article;
  minutes: number;
  headings: Heading[];
  saved: SavedItem;
  shareUrl: string;
}) {
  const { author } = article;
  return (
    <aside aria-label="أدوات المقال" className="no-print hidden lg:block">
      <div className="sticky top-28 flex max-h-[calc(100dvh-8rem)] flex-col gap-6 overflow-y-auto border-s border-line ps-8 pe-1 pb-2">
        <div className="border-b border-line pb-4">
          <div className="-ms-2.5 flex items-center gap-1">
            <BookmarkButton item={saved} />
            <ShareButton url={shareUrl} title={article.title} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* No byline (and no placeholder avatar) when the CMS exposes no usable author. */}
          {author.name ? <AuthorAvatar author={author} size={44} /> : null}
          <div className="min-w-0">
            {!author.name ? null : author.slug ? (
              // The pseudo-element widens the touch target to 44px; the inner span truncates so it is not clipped.
              <Link
                href={routes.author(author.slug)}
                className="relative block text-sm font-semibold text-ink transition-colors after:absolute after:-inset-x-1 after:-inset-y-3 hover:text-brand-700"
              >
                <span className="block truncate">{author.name}</span>
              </Link>
            ) : (
              <span className="block truncate text-sm font-semibold text-ink">{author.name}</span>
            )}
            <time dateTime={isoDate(article.date)} className="meta">
              {formatDate(article.date)}
            </time>
          </div>
        </div>

        <p className="flex items-center gap-2 text-meta text-ink-soft">
          <ClockIcon width={18} height={18} className="shrink-0 text-muted" />
          مدّة القراءة: {minutesLabel(minutes)}
        </p>

        <InlineReadingProgress layout="sidebar" />

        {headings.length ? <TableOfContents headings={headings} className="border-t border-line pt-6" /> : null}
      </div>
    </aside>
  );
}
