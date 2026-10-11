'use client';

import { BookmarkIcon } from '@/components/icons';
import { useSaved, type SavedArticle } from '@/lib/client/saved';

export function BookmarkButton({ article, variant = 'icon' }: { article: Omit<SavedArticle, 'savedAt'>; variant?: 'icon' | 'full' }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(article.slug);
  const label = saved ? 'إزالة من المحفوظات' : 'حفظ المقال';
  return (
    <button
      type="button"
      onClick={() => toggle(article)}
      aria-pressed={saved}
      aria-label={variant === 'icon' ? label : undefined}
      title={label}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition active:scale-95 ${
        variant === 'icon' ? 'h-11 w-11' : 'h-11 px-4 text-sm font-medium'
      } ${saved ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700'}`}
    >
      <BookmarkIcon size={19} filled={saved} />
      {variant === 'full' && (saved ? 'محفوظ' : 'حفظ')}
    </button>
  );
}
