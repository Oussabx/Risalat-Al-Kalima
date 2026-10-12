import { MailIcon } from '@/components/icons';
import { NewsletterForm } from '@/components/NewsletterForm';
import { Reveal } from '@/components/Reveal';

/** Inline newsletter sign-up (never a popup). Success is shown only after the server confirms it. */
export function NewsletterBand() {
  return (
    <section aria-labelledby="home-newsletter" className="container-site">
      <Reveal>
        <div className="card relative overflow-hidden px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <div
            className="pointer-events-none absolute -top-28 -start-28 size-72 rounded-full bg-[radial-gradient(closest-side,var(--color-brand-100),transparent)]"
            aria-hidden="true"
          />
          <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
            <div className="flex items-start gap-4">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600" aria-hidden="true">
                <MailIcon width={24} height={24} />
              </span>
              <div className="min-w-0">
                <h2 id="home-newsletter" className="text-h2 font-bold text-ink sm:text-[1.5rem]">
                  النشرة البريديّة
                </h2>
                <p className="mt-1.5 text-base leading-relaxed text-muted">تصلك مقالات المجلّة الجديدة إلى بريدك.</p>
              </div>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
