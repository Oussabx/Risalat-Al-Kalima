import { NewsletterForm } from '@/components/NewsletterForm';
import { MailIcon } from '@/components/icons';

export function NewsletterBand() {
  return (
    <section aria-labelledby="newsletter-title" className="container-page mt-16 lg:mt-24" data-reveal>
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-bl from-brand-700 via-brand-600 to-brand-800 px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-16">
        <div aria-hidden className="pointer-events-none absolute -start-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 end-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <MailIcon size={22} />
            </span>
            <h2 id="newsletter-title" className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
              اشترك في نشرة رسالة الكلمة
            </h2>
            <p className="mt-3 max-w-md leading-8 text-white/80">مقالات جديدة وتأمّلات مختارة تصلك إلى بريدك الإلكترونيّ مجّانًا. يمكنك إلغاء الاشتراك متى شئت.</p>
          </div>
          <NewsletterForm tone="dark" />
        </div>
      </div>
    </section>
  );
}
