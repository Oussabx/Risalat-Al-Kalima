/** Article skeleton: hero card, breadcrumbs, text lines and the slim sidebar. */
export default function ArticleLoading() {
  const lines = ['w-full', 'w-[96%]', 'w-full', 'w-[88%]', 'w-[93%]', 'w-[70%]'];
  return (
    <div className="bg-surface pt-4 pb-16 sm:pt-6" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ تحميل المقال…</span>
      <div className="container-site" aria-hidden="true">
        <div className="skeleton relative aspect-[4/3] rounded-(--radius-card) sm:aspect-[16/9] lg:aspect-[21/9]">
          <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-8 lg:p-10">
            <div className="h-6 w-16 rounded-full bg-white/70" />
            <div className="h-9 w-4/5 max-w-xl rounded-lg bg-white/70 sm:h-11" />
            <div className="flex items-center gap-3 pt-1">
              <div className="size-9 rounded-full bg-white/70" />
              <div className="h-4 w-40 rounded bg-white/70" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[68rem]">
          <div className="skeleton mt-5 h-4 w-64 max-w-full" />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12 xl:gap-14">
            <div className="max-w-[46rem] space-y-8">
              {[0, 1, 2].map((block) => (
                <div key={block} className="space-y-3.5">
                  {lines.map((width, i) => (
                    <div key={i} className={`skeleton h-4 ${width}`} />
                  ))}
                </div>
              ))}
            </div>
            <div className="hidden space-y-5 border-s border-line ps-8 lg:block">
              <div className="flex gap-2">
                <div className="skeleton size-10 rounded-full" />
                <div className="skeleton size-10 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <div className="skeleton size-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
              <div className="skeleton h-3 w-32" />
              <div className="skeleton h-2 w-full rounded-full" />
              <div className="space-y-3 pt-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-3.5 w-[85%]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
