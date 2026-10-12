import { ARCHIVE_BAND } from './ArchiveHeader';
import { GRID_3 } from './styles';

/** Loading placeholder for archive pages: header band, filter row and a grid (or list) of cards. */
export function ArchiveSkeleton({ variant = 'grid', chips = true, form = false }: { variant?: 'grid' | 'list'; chips?: boolean; form?: boolean }) {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        جارٍ التحميل…
      </p>
      <div className={ARCHIVE_BAND} aria-hidden="true">
        <div className="container-site py-8 sm:py-12">
          <div className="skeleton mb-6 h-4 w-44 sm:mb-8" />
          <div className="skeleton h-4 w-24" />
          <div className="skeleton mt-3 h-9 w-72 max-w-full" />
          <div className="skeleton mt-4 h-4 w-full max-w-xl" />
          <div className="skeleton mt-2.5 h-4 w-4/5 max-w-md" />
          {form ? <div className="skeleton mt-8 h-14 w-full max-w-3xl rounded-xl" /> : null}
        </div>
      </div>
      <div className="container-site py-8 sm:py-10" aria-hidden="true">
        {chips ? (
          <div className="flex gap-2 overflow-hidden py-1">
            {[56, 88, 72, 104, 80, 96, 64].map((w, i) => (
              <div key={i} className="skeleton h-9 shrink-0 rounded-full" style={{ width: w }} />
            ))}
          </div>
        ) : null}
        <div className="mt-5 flex items-center justify-between gap-4 border-b border-line pb-5">
          <div className="skeleton h-4 w-36" />
          <div className="skeleton h-11 w-56 rounded-full" />
        </div>
        <div className="mt-8">{variant === 'list' ? <ListSkeleton /> : <GridSkeleton />}</div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className={GRID_3}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={`card overflow-hidden ${i > 2 ? 'hidden sm:block' : ''}`}>
          <div className="skeleton aspect-[16/10] rounded-none" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="skeleton h-5 w-11/12" />
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-3.5 w-full" />
            <div className="skeleton mt-6 h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="card divide-y divide-line px-4 sm:px-6">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-4 py-5 sm:gap-6">
          <div className="skeleton aspect-[4/3] w-24 shrink-0 rounded-xl sm:w-44" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-3.5 w-20" />
            <div className="skeleton h-5 w-4/5" />
            <div className="skeleton h-3.5 w-full" />
            <div className="skeleton h-3.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
