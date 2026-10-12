import Link from 'next/link';
import type { Category } from '@/lib/content/types';
import { routes } from '@/lib/routes';

/** Category pill linking to its archive. `solid` sits on images, `soft` on white. */
export function CategoryBadge({ category, tone = 'solid', className = '' }: { category: Pick<Category, 'name' | 'slug'>; tone?: 'solid' | 'soft'; className?: string }) {
  return (
    <Link
      href={routes.category(category.slug)}
      className={`${tone === 'solid' ? 'badge hover:bg-brand-700' : 'badge-soft hover:bg-brand-200'} relative z-10 transition-colors ${className}`}
    >
      {category.name}
    </Link>
  );
}
