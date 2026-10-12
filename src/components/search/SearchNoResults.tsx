import Link from 'next/link';
import { routes } from '@/lib/routes';
import { ArrowLeftIcon, CheckIcon, SearchIcon } from '../icons';

const TIPS = ['تحقّق من إملاء الكلمات.', 'جرّب كلمات أقلّ أو أعمّ، أو كلمة مرادفة.', 'ابحث باسم الكاتب أو باسم القسم.', 'تصفّح الأقسام أدناه أو كلّ المقالات.'];

/** No-results state for the search page, with practical suggestions. */
export function SearchNoResults({ query }: { query: string }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center sm:py-14">
      <span className="mb-5 inline-flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <SearchIcon width={26} height={26} />
      </span>
      <h2 className="text-h3 font-bold text-ink [overflow-wrap:anywhere]">لا توجد نتائج لـ “<bdi>{query}</bdi>”</h2>
      <p className="mt-2 text-base text-muted">بعض الاقتراحات:</p>
      <ul role="list" className="mt-4 space-y-2 text-start text-[0.9375rem] text-ink-soft">
        {TIPS.map((tip) => (
          <li key={tip} className="flex items-start gap-2">
            <CheckIcon width={18} height={18} className="mt-1 shrink-0 text-brand-600" />
            {tip}
          </li>
        ))}
      </ul>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href={routes.articles()} className="btn-primary">
          تصفّح كلّ المقالات
          <ArrowLeftIcon width={16} height={16} />
        </Link>
        <Link href={routes.search()} className="btn-outline">
          بحث جديد
        </Link>
      </div>
    </div>
  );
}
