import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SavedList } from '@/components/saved/SavedList';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'المحفوظات',
  description: 'المقالات التي حفظتها لتقرأها لاحقًا على هذا الجهاز.',
  alternates: { canonical: routes.saved() },
  robots: { index: false, follow: true },
};

/** Saved articles. The list lives in this browser (localStorage) and is rendered on the client. */
export default function SavedPage() {
  return (
    <div className="container-site pt-6 pb-16 sm:pt-8 sm:pb-20">
      <Breadcrumbs items={[{ label: 'المحفوظات' }]} />
      <header className="mt-6 max-w-2xl sm:mt-8">
        <h1 className="text-h1 font-bold text-ink sm:text-[2.25rem] sm:leading-[1.45]">المحفوظات</h1>
        <p className="mt-2 text-base leading-relaxed text-muted">المقالات التي حفظتها لتقرأها لاحقًا. تُحفظ القائمة على هذا الجهاز وفي هذا المتصفّح فقط.</p>
      </header>
      <SavedList className="mt-8 sm:mt-10" />
    </div>
  );
}
