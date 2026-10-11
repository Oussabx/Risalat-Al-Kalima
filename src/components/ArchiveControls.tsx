'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ChevronDown, CloseIcon, SearchIcon } from '@/components/icons';
import type { SortKey } from '@/lib/content/types';

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'title', label: 'أبجديًّا' },
];

/**
 * Filters that drive the server-rendered archive through the URL, so every
 * state is shareable and the back button works.
 */
export function ArchiveControls({
  categories,
  showSearch = false,
  showCategory = false,
}: {
  categories?: { slug: string; name: string }[];
  showSearch?: boolean;
  showCategory?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get('q') ?? '');

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const active = params.get('category') || params.get('q') || (params.get('sort') && params.get('sort') !== 'newest');

  return (
    <div className={`flex flex-col gap-3 transition-opacity sm:flex-row sm:flex-wrap sm:items-center ${pending ? 'opacity-60' : ''}`} aria-busy={pending}>
      {showSearch && (
        <form
          role="search"
          className="relative flex-1 sm:min-w-64"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: q.trim() || null });
          }}
        >
          <label htmlFor="archive-q" className="sr-only">
            ابحث ضمن المقالات
          </label>
          <SearchIcon size={18} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="archive-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث ضمن المقالات…"
            className="h-11 w-full rounded-xl border border-line bg-white ps-10 pe-4 text-[0.95rem] outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </form>
      )}

      {showCategory && categories && (
        <Select
          label="القسم"
          value={params.get('category') ?? ''}
          onChange={(v) => update({ category: v || null })}
          options={[{ value: '', label: 'كل الأقسام' }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
        />
      )}

      <Select
        label="الترتيب"
        value={params.get('sort') ?? 'newest'}
        onChange={(v) => update({ sort: v === 'newest' ? null : v })}
        options={sortOptions}
      />

      {active && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            startTransition(() => router.push(pathname, { scroll: false }));
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-white hover:text-ink"
        >
          <CloseIcon size={16} /> مسح الفلاتر
        </button>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex h-11 items-center rounded-xl border border-line bg-white text-[0.95rem] transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
      <span className="ps-4 text-muted">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full cursor-pointer appearance-none bg-transparent ps-2 pe-10 font-medium text-ink outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute end-3.5 text-muted" />
    </label>
  );
}
