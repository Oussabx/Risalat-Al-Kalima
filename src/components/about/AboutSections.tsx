import Link from 'next/link';
import type { NavGroup } from '@/lib/content';
import { routes } from '@/lib/routes';

/** The magazine's sections (menu categories) grouped as in the navigation; links resolve to live category slugs. */
export function AboutSections({ groups }: { groups: NavGroup[] }) {
  if (!groups.length) return null;
  return (
    <section aria-labelledby="about-sections" className="border-y border-line bg-surface-2">
      <div className="container-site py-12 sm:py-16">
        <h2 id="about-sections" className="flex items-center gap-3 text-h2 font-bold text-ink sm:text-[1.5rem]">
          <span className="h-6 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
          أبواب المجلّة
        </h2>
        <p className="mt-1.5 ms-[1.125rem] text-sm leading-relaxed text-muted sm:text-base">موضوعات روحيّة وأخلاقيّة واجتماعيّة موزّعة على أبواب ثابتة.</p>
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {groups.map((group, index) => {
            const headingId = `about-group-${index}`;
            return (
              <section key={group.title} aria-labelledby={headingId} className="card p-6">
                <h3 id={headingId} className="text-h3 font-bold text-ink">
                  {group.title}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.categories.map((category) => (
                    <li key={category.id}>
                      <Link href={routes.category(category.slug)} className="chip min-h-11">
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
