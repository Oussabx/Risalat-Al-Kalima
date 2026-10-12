'use client';

import { useEffect } from 'react';

/** Last-resort boundary when the root layout itself fails: no app styles are guaranteed here. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7fa', color: '#1f2937', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: '32rem', padding: '2rem 1.25rem', textAlign: 'center', lineHeight: 1.9 }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.75rem' }}>حدث خطأ غير متوقّع</h1>
          <p style={{ margin: '0 0 1.5rem', color: '#4b5563' }}>تعذّر تحميل الموقع الآن. يرجى إعادة المحاولة بعد لحظات.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{ minHeight: 44, padding: '0 1.5rem', border: 0, borderRadius: 999, background: '#2563eb', color: '#fff', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
            >
              أعد المحاولة
            </button>
            {/* A plain link forces a full reload, which is what is needed after a root failure. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 1.5rem', borderRadius: 999, border: '1px solid #2563eb', color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>
              الصفحة الرئيسيّة
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
