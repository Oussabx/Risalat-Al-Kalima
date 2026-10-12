'use client';

import { toggleSaved, useIsSaved, type SavedItem } from '@/lib/client/saved';
import { BookmarkIcon } from '../icons';
import { Toast, useFlash } from './Toast';

/**
 * Save / unsave toggle backed by the local saved-articles store. The state is
 * read after hydration (the server always renders "not saved").
 *
 *  - icon:  round icon button (sidebar, mobile action bar)
 *  - chip:  pill with a visible label
 */
export function BookmarkButton({ item, variant = 'icon', className = '' }: { item: SavedItem; variant?: 'icon' | 'chip'; className?: string }) {
  const saved = useIsSaved(item.slug);
  const [flash, show] = useFlash();
  const label = saved ? 'إزالة من المحفوظات' : 'حفظ المقال';

  const onClick = () => {
    const now = toggleSaved(item);
    show(now ? 'تمّ حفظ المقال في المحفوظات' : 'أُزيل المقال من المحفوظات');
  };

  return (
    <>
      {variant === 'chip' ? (
        <button type="button" onClick={onClick} aria-pressed={saved} className={`chip min-h-11 ${className}`}>
          <BookmarkIcon width={18} height={18} filled={saved} />
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={saved}
          aria-label={label}
          title={label}
          className={`icon-btn ${saved ? 'text-brand-600 hover:text-brand-700' : ''} ${className}`}
        >
          <BookmarkIcon width={22} height={22} filled={saved} />
        </button>
      )}
      <Toast flash={flash} />
    </>
  );
}
