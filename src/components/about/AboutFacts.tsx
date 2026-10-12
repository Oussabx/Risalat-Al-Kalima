import { BookIcon, CalendarIcon, CheckIcon, UserIcon } from '@/components/icons';

type Fact = { title: string; body: string };

const ICONS = [CalendarIcon, UserIcon, BookIcon, CheckIcon] as const;

/** The magazine's published facts about itself (aboutFacts.points), one card each. */
export function AboutFacts({ points }: { points: readonly Fact[] }) {
  if (!points.length) return null;
  return (
    <section aria-labelledby="about-facts" className="container-site py-12 sm:py-16">
      <h2 id="about-facts" className="flex items-center gap-3 text-h2 font-bold text-ink sm:text-[1.5rem]">
        <span className="h-6 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
        المجلّة في سطور
      </h2>
      <ul className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {points.map((point, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <li key={point.title} className="card flex flex-col p-6 transition-shadow duration-200 hover:shadow-(--shadow-lift)">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600" aria-hidden="true">
                <Icon width={24} height={24} />
              </span>
              <h3 className="mt-5 text-h3 font-bold text-ink">{point.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-[1.9] text-ink-soft">{point.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
