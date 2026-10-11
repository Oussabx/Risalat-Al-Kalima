import Link from 'next/link';
import type { Term } from '@/lib/content/types';
import { routes } from '@/lib/routes';

export function CategoryBadge({ term, tone = 'solid', link = true }: { term: Term; tone?: 'solid' | 'soft'; link?: boolean }) {
  const cls = `relative z-10 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold leading-5 transition ${
    tone === 'solid' ? 'bg-brand-600 text-white shadow-sm ring-1 ring-white/25 hover:bg-brand-700' : 'bg-brand-100 text-brand-800 hover:bg-brand-200'
  }`;
  return link ? (
    <Link href={routes.category(term.slug)} className={cls}>
      {term.name}
    </Link>
  ) : (
    <span className={cls}>{term.name}</span>
  );
}
