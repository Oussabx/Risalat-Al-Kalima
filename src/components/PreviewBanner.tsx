import { isPreview } from '@/lib/content';

/** Announces preview mode so placeholder content is never mistaken for published content. */
export function PreviewBanner() {
  if (!isPreview) return null;
  return (
    <div data-preview-banner className="bg-amber-50 px-4 py-2 text-center text-meta text-amber-900">
      <strong className="font-semibold">وضع المعاينة:</strong> العناوين وأسماء الكتّاب حقيقيّة، أمّا نصوص المقالات والصور فمؤقّتة وتُستبدل تلقائيًّا بمحتوى ووردبريس.
    </div>
  );
}
