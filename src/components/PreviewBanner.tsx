/** Shown on every page while the site runs on local preview data instead of WordPress. */
export function PreviewBanner() {
  return (
    <div role="note" className="no-print bg-amber-50 text-amber-900 ring-1 ring-amber-200">
      <p className="container-page py-2 text-center text-[0.8rem] leading-6">
        <strong>وضع المعاينة:</strong> العناوين وأسماء الكتّاب من الموقع الأصليّ، أمّا نصوص المقالات والصور فمؤقّتة وتُستبدل تلقائيًا بمحتوى WordPress عند التشغيل الفعليّ.
      </p>
    </div>
  );
}
