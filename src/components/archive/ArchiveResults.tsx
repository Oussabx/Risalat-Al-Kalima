import type { ArticleSummary } from '@/lib/content/types';
import { ArticleGrid } from './ArticleGrid';
import { BookGrid } from './BookGrid';
import type { ArchiveKind } from './kinds';
import { MediaGrid } from './MediaGrid';

/** Picks the grid for an archive: video, library or the standard article grid. */
export function ArchiveResults({
  kind = 'articles',
  articles,
  featured = false,
  featuredLabel,
  label,
}: {
  kind?: ArchiveKind;
  articles: ArticleSummary[];
  featured?: boolean;
  featuredLabel?: string;
  label?: string;
}) {
  if (kind === 'media') return <MediaGrid articles={articles} featured={featured} label={label} />;
  if (kind === 'books') return <BookGrid articles={articles} label={label} />;
  return <ArticleGrid articles={articles} featured={featured} featuredLabel={featuredLabel} label={label} />;
}
