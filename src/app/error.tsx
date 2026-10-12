'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertIcon, HomeIcon } from '@/components/icons';

/** Route-level error boundary: the header and footer stay in place. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site py-16 sm:py-24">
      <section role="alert" className="card mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center sm:px-10">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-red-50 text-danger" aria-hidden="true">
          <AlertIcon width={26} height={26} />
        </span>
        <h1 className="mt-5 text-h2 font-bold text-ink sm:text-h1">حدث خطأ غير متوقّع</h1>
        <p className="mt-3 text-base leading-[1.9] text-ink-soft">تعذّر عرض هذه الصفحة الآن. قد يكون الخلل مؤقّتًا؛ أعد المحاولة بعد لحظات.</p>
        {error.digest ? (
          <p className="mt-2 text-meta text-muted">
            رمز الخطأ: <span dir="ltr">{error.digest}</span>
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary min-h-11 px-6">
            أعد المحاولة
          </button>
          <Link href="/" className="btn-outline min-h-11 px-6">
            <HomeIcon width={18} height={18} />
            الصفحة الرئيسيّة
          </Link>
        </div>
      </section>
    </div>
  );
}
