import Link from 'next/link';
import { ArrowLeftIcon, QuoteIcon } from '@/components/icons';
import { Reveal } from '@/components/Reveal';
import { routes } from '@/lib/routes';
import { site } from '@/lib/site';

/** The magazine's own published mission statement (من نحن), styled as the mockup's quote card. */
export function MissionCard() {
  return (
    <section aria-labelledby="home-mission" className="container-site">
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-line bg-gradient-to-b from-white to-brand-50 px-6 py-12 text-center shadow-(--shadow-card) sm:px-14 sm:py-16">
          <h2 id="home-mission" className="sr-only">
            رسالة المجلّة
          </h2>
          <QuoteIcon width={44} height={44} className="mx-auto text-brand-500" />
          <figure className="mt-5">
            <blockquote className="text-[1.1875rem] leading-[2] font-medium text-ink sm:text-[1.375rem] sm:leading-[2]">
              <p>{site.description}</p>
            </blockquote>
            <figcaption className="mt-8 text-meta font-semibold text-ink-soft">
              <span className="mx-auto mb-5 block h-[3px] w-14 rounded-full bg-brand-500" aria-hidden="true" />
              {site.fullName}
            </figcaption>
          </figure>
          <Link href={routes.about()} className="btn-outline mt-7">
            تعرّف إلى المجلّة
            <ArrowLeftIcon width={16} height={16} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
