import Link from 'next/link';
import type { Category } from '@/lib/content/types';
import { routes } from '@/lib/routes';

/** «أقسام ذات صلة»: sibling categories from the same menu group, as chips. */
export function RelatedCategories({ categories, title = 'أقسام ذات صلة' }: { categories: Category[]; title?: string }) {
  if (!categories.length) return null;
  return (
    <section aria-labelledby="related-categories-title" className="mt-14 border-t border-line pt-8 sm:mt-16">
      <h2 id="related-categories-title" className="flex items-center gap-3 text-h3 font-bold text-ink">
        <span className="h-5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
        {title}
      </h2>
      <ul role="list" className="mt-5 flex flex-wrap gap-2.5">
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={routes.category(category.slug)} className="chip-soft min-h-11 gap-2 px-5">
              {category.name}
              <span className="text-xs font-normal tabular-nums">
                <span className="sr-only">(</span>
                {category.count}
                <span className="sr-only">)</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
