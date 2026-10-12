import Link from 'next/link';
import { ArrowLeftIcon } from './icons';

/** Section title with an optional description and "view all" link. */
export function SectionHeader({
  title,
  description,
  href,
  linkLabel = 'عرض الكل',
  as: H = 'h2',
  id,
  className = '',
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  as?: 'h2' | 'h3';
  id?: string;
  className?: string;
}) {
  return (
    <div className={`mb-6 flex items-end justify-between gap-4 sm:mb-8 ${className}`}>
      <div className="min-w-0">
        <H id={id} className="flex items-center gap-3 text-h2 font-bold text-ink sm:text-[1.5rem]">
          <span className="h-6 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
          {title}
        </H>
        {description ? <p className="mt-1.5 ms-[1.125rem] text-sm leading-relaxed text-muted sm:text-base">{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-brand-700 hover:text-brand-800">
          {linkLabel}
          <ArrowLeftIcon width={16} height={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
          {description || title ? <span className="sr-only">: {title}</span> : null}
        </Link>
      ) : null}
    </div>
  );
}
