import Link from 'next/link';
import { ChevronLeft } from '@/components/icons';
import { site } from '@/lib/site';

export type Crumb = { label: string; href?: string };

/** RTL breadcrumb trail with BreadcrumbList structured data. */
export function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: 'الرئيسية', href: '/' }, ...items];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${site.url}${c.href}` } : {}),
    })),
  };
  return (
    <nav aria-label="مسار التنقّل" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-[0.8rem] text-muted">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="inline-flex min-w-0 items-center gap-1">
              {c.href && !last ? (
                <Link href={c.href} className="transition hover:text-brand-700">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={`truncate ${last ? 'max-w-[16rem] text-ink-soft' : ''}`}>
                  {c.label}
                </span>
              )}
              {!last && <ChevronLeft size={14} className="shrink-0 opacity-60" />}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
