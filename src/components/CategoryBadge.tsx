import Link from 'next/link';
import type { Category } from '@/lib/content/types';
import { routes } from '@/lib/routes';

/** Invisible 44px-tall hit area around the small pill (no visual change). */
const HIT_AREA = "after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-['']";

/** Category pill linking to its archive. `solid` sits on images, `soft` on white. */
export function CategoryBadge({ category, tone = 'solid', className = '' }: { category: Pick<Category, 'name' | 'slug'>; tone?: 'solid' | 'soft'; className?: string }) {
  return (
    <Link
      href={routes.category(category.slug)}
      className={`${tone === 'solid' ? 'badge hover:bg-brand-700' : 'badge-soft hover:bg-brand-200'} relative z-10 transition-colors ${HIT_AREA} ${className}`}
    >
      {category.name}
    </Link>
  );
}
