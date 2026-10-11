import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SavedList } from '@/components/SavedList';

export const metadata: Metadata = {
  title: 'المقالات المحفوظة',
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <div className="container-page pt-6 sm:pt-8">
      <Breadcrumbs items={[{ label: 'المقالات المحفوظة' }]} />
      <h1 className="mt-5 text-3xl font-bold text-ink sm:text-4xl">المقالات المحفوظة</h1>
      <p className="mt-2 text-muted">تُحفظ في هذا المتصفّح على جهازك، لتعود إليها لاحقًا.</p>
      <SavedList />
    </div>
  );
}
