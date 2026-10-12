import { Breadcrumbs } from '@/components/Breadcrumbs';
import { QuoteIcon } from '@/components/icons';

/** Calm opening of the About page: eyebrow, title and the magazine's own mission statement. */
export function AboutHero({ mission }: { mission: string }) {
  return (
    <header className="relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-brand-100/80 via-brand-50 to-canvas">
      <div className="pointer-events-none absolute -end-24 -top-32 -z-10 size-80 rounded-full bg-brand-200/45 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -start-32 bottom-0 -z-10 size-72 rounded-full bg-white/70 blur-3xl" aria-hidden="true" />
      <div className="container-site pt-8 pb-14 sm:pt-12 sm:pb-20">
        <Breadcrumbs items={[{ label: 'من نحن' }]} />
        <div className="mx-auto mt-10 max-w-3xl text-center sm:mt-14">
          <p className="eyebrow">من نحن</p>
          <h1 className="mt-3 text-[2rem] leading-[1.35] font-bold text-ink sm:text-display">مجلّة رسالة الكلمة</h1>
          <span className="mx-auto mt-5 block h-1 w-14 rounded-full bg-brand-500" aria-hidden="true" />
          <figure className="mt-8">
            <QuoteIcon width={36} height={36} className="mx-auto text-brand-300" />
            <blockquote className="mt-3 text-[1.1875rem] leading-[2] font-medium text-ink-soft sm:text-[1.375rem] sm:leading-[2]">
              <p>{mission}</p>
            </blockquote>
          </figure>
        </div>
      </div>
    </header>
  );
}
