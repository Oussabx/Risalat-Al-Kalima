import Link from 'next/link';
import { EmptyState } from '../EmptyState';
import { ArrowRightIcon } from '../icons';

/**
 * Shown for a page number past the last page of a listing (old links, edited
 * URLs). The page is also marked noindex in its metadata.
 */
export function OutOfRange({ firstPageHref }: { firstPageHref: string }) {
  return (
    <EmptyState
      title="لا توجد مقالات في هذه الصفحة"
      description="يبدو أنّ رقم الصفحة يتجاوز آخر صفحات هذه القائمة. عُد إلى الصفحة الأولى لتصفّح المقالات."
      action={
        <Link href={firstPageHref} className="btn-primary">
          <ArrowRightIcon width={16} height={16} />
          الصفحة الأولى
        </Link>
      }
    />
  );
}
