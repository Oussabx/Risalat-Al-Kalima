import Link from 'next/link';
import { absoluteUrl } from '@/lib/routes';
import { site } from '@/lib/site';
import { ChevronLeftIcon } from './icons';
import { JsonLd } from './JsonLd';

export type Crumb = { label: string; href?: string };

/** RTL breadcrumb trail (الرئيسية ‹ … ‹ current page) with BreadcrumbList structured data. */
export function Breadcrumbs({ items, tone = 'default', className = '' }: { items: Crumb[]; tone?: 'default' | 'light'; className?: string }) {
  const trail: Crumb[] = [{ label: 'الرئيسية', href: '/' }, ...items];
  const linkCls = tone === 'light' ? 'text-white/80 hover:text-white' : 'text-muted hover:text-brand-700';
  const currentCls = tone === 'light' ? 'text-white' : 'text-ink-soft';
  return (
    <nav aria-label="مسار التنقّل" className={`text-meta ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {crumb.href && !last ? (
                <Link href={crumb.href} className={`transition-colors ${linkCls}`}>
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={`line-clamp-1 font-medium ${currentCls}`}>
                  {crumb.label}
                </span>
              )}
              {!last ? <ChevronLeftIcon width={14} height={14} className={tone === 'light' ? 'text-white/60' : 'text-line-strong'} /> : null}
            </li>
          );
        })}
      </ol>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: trail.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: absoluteUrl(c.href, site.url) } : {}),
          })),
        }}
      />
    </nav>
  );
}
