import { articlesLabel } from '@/lib/arabic';
import { Breadcrumbs, type Crumb } from '../Breadcrumbs';

/** Brand band behind archive headings (shared with the loading skeletons). */
export const ARCHIVE_BAND = 'relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-brand-100/80 via-brand-50 to-canvas';

/**
 * Archive page heading on a soft brand band: breadcrumbs, eyebrow, title,
 * description and the real article count. `media` takes an avatar or a
 * `HeaderIcon`; `children` adds a row underneath (a search form, for example).
 */
export function ArchiveHeader({
  title,
  eyebrow,
  description,
  count,
  media,
  breadcrumbs,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  /** Number of articles in the archive, shown as «24 مقالًا» (hidden when 0: the empty state says it). */
  count?: number;
  media?: React.ReactNode;
  breadcrumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <header className={ARCHIVE_BAND}>
      <div className="pointer-events-none absolute -end-24 -top-32 -z-10 size-80 rounded-full bg-brand-200/45 blur-3xl" aria-hidden="true" />
      <div className="container-site py-7 sm:py-9 lg:py-10">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className="mb-5 sm:mb-6" /> : null}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          {media ? <div className="shrink-0">{media}</div> : null}
          <div className="min-w-0 flex-1">
            {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
            <h1 className="text-[1.75rem] leading-[1.45] font-bold text-ink sm:text-h1">{title}</h1>
            {description ? <p className="mt-3 max-w-2xl text-base leading-[1.9] text-ink-soft">{description}</p> : null}
          </div>
          {count ? (
            // The archive's one article count: under the title on phones, closing the row at the end side from `sm` up.
            <p className="inline-flex shrink-0 items-center self-start rounded-full bg-white/85 px-3.5 py-1 text-meta font-semibold text-brand-700 ring-1 ring-brand-200 sm:self-center sm:px-4 sm:py-1.5 sm:text-sm">
              {articlesLabel(count)}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-6 sm:mt-8">{children}</div> : null}
      </div>
    </header>
  );
}

/** Square icon tile for the `media` slot of an archive header. */
export function HeaderIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-(--shadow-card) ring-1 ring-brand-100 sm:size-16" aria-hidden="true">
      {children}
    </span>
  );
}
