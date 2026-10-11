'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page py-20 text-center sm:py-28">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">تعذّر تحميل المحتوى</h1>
      <p className="mx-auto mt-3 max-w-md leading-8 text-muted">حدث خطأ أثناء الاتصال بمصدر المقالات. يرجى المحاولة مجددًا بعد لحظات.</p>
      <button type="button" onClick={reset} className="mt-8 inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700">
        إعادة المحاولة
      </button>
    </div>
  );
}
