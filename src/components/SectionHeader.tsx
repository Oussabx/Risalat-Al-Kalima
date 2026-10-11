import Link from 'next/link';
import { ArrowLeft } from '@/components/icons';

export function SectionHeader({
  title,
  description,
  href,
  linkLabel = 'عرض الكل',
  id,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4 sm:mb-8">
      <div>
        <h2 id={id} className="flex items-center gap-3 text-xl font-bold text-ink sm:text-2xl">
          <span aria-hidden className="h-6 w-1 rounded-full bg-brand-500" />
          {title}
        </h2>
        {description && <p className="mt-1.5 ps-4 text-sm leading-7 text-muted">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
          {linkLabel}
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        </Link>
      )}
    </div>
  );
}
