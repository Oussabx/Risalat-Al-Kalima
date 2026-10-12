import Link from 'next/link';
import { getNavigation } from '@/lib/content';
import { routes } from '@/lib/routes';
import { ArrowLeftIcon } from '../icons';

/** Category groups from the live menu (only sections with articles), with links to the full archive and the editors' picks. */
export async function BrowseCategories({ title = 'تصفّح الأقسام', description }: { title?: string; description?: string }) {
  const { groups } = await getNavigation();
  const visible = groups.map((g) => ({ ...g, categories: g.categories.filter((c) => c.count > 0) })).filter((g) => g.categories.length);
  return (
    <section aria-labelledby="browse-categories-title" className="card p-5 sm:p-8">
      <h2 id="browse-categories-title" className="flex items-center gap-3 text-h2 font-bold text-ink">
        <span className="h-6 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
        {title}
      </h2>
      {description ? <p className="ms-[1.125rem] mt-1.5 text-sm leading-relaxed text-muted sm:text-base">{description}</p> : null}
      {visible.length ? (
        <div className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-2">
          {visible.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted">{group.title}</h3>
              <ul role="list" className="mt-3 flex flex-wrap gap-2">
                {group.categories.map((category) => (
                  <li key={category.id}>
                    <Link href={routes.category(category.slug)} className="chip min-h-11">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link href={routes.articles()} className="btn-primary">
          كلّ المقالات
          <ArrowLeftIcon width={16} height={16} />
        </Link>
        <Link href={routes.picks()} className="btn-outline">
          مختارات المحرّر
        </Link>
      </div>
    </section>
  );
}
