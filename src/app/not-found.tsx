import Link from 'next/link';
import { SearchIcon } from '@/components/icons';
import { routes } from '@/lib/routes';

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center sm:py-28">
      <p className="text-7xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">لم نعثر على هذه الصفحة</h1>
      <p className="mx-auto mt-3 max-w-md leading-8 text-muted">ربّما نُقل المقال أو تغيّر رابطه. جرّب البحث عنه أو العودة إلى الصفحة الرئيسيّة.</p>
      <form role="search" action={routes.search()} className="relative mx-auto mt-8 max-w-md">
        <label htmlFor="nf-q" className="sr-only">
          ابحث
        </label>
        <SearchIcon size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
        <input id="nf-q" name="q" type="search" placeholder="ابحث في المقالات…" className="h-12 w-full rounded-xl border border-line bg-white ps-11 pe-4 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
      </form>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700">
        الصفحة الرئيسيّة
      </Link>
    </div>
  );
}
