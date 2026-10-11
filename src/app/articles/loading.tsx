import { ArticleCardSkeleton } from '@/components/ArticleCard';

export default function Loading() {
  return (
    <div className="container-page pt-8" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-6 h-10 w-72 max-w-full" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="skeleton mt-8 h-72 w-full rounded-2xl" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
