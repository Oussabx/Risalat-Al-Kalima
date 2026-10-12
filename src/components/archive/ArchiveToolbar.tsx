/** Row above an archive grid: a summary (count, page, active filters) and an optional control such as SortControl. */
export function ArchiveToolbar({ summary, children, className = '' }: { summary: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-5 ${className}`}>
      <p className="text-sm leading-relaxed text-ink-soft">{summary}</p>
      {children}
    </div>
  );
}

/** «الصفحة 2 من 7», or nothing for a single page. */
export function pageOf(page: number, totalPages: number): string {
  return totalPages > 1 ? `الصفحة ${page} من ${totalPages}` : '';
}
