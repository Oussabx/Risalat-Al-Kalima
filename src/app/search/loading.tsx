import { ArticleCardSkeleton } from '@/components/ArticleCard';

export default function Loading() {
  return (
    <div className="container-page pt-8" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-6 h-10 w-80 max-w-full" />
      <div className="skeleton mt-6 h-14 w-full max-w-2xl rounded-2xl" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
