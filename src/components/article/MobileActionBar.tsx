'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SavedItem } from '@/lib/client/saved';
import { ArrowLeftIcon } from '../icons';
import { BookmarkButton } from './BookmarkButton';
import { ShareButton } from './ShareButton';

/**
 * Bottom action bar on phones and tablets (below `lg`): the next article as
 * the primary action, plus share and bookmark. It slides away while the site
 * footer is on screen so it never covers it.
 */
export function MobileActionBar({
  saved,
  shareUrl,
  title,
  next,
}: {
  saved: SavedItem;
  shareUrl: string;
  title: string;
  next: { href: string; title?: string };
}) {
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer[data-site-footer]');
    if (!footer || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <div
      inert={footerVisible}
      className={`no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgb(15_23_42/0.18)] backdrop-blur-md transition-transform duration-300 ease-out lg:hidden ${
        footerVisible ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="container-site flex h-16 items-center gap-1">
        <Link href={next.href} aria-label={next.title ? `المقال التالي: ${next.title}` : undefined} className="btn-primary min-w-0 px-5 sm:px-6">
          {next.title ? 'المقال التالي' : 'المقالات'}
          <ArrowLeftIcon width={18} height={18} />
        </Link>
        <div className="ms-auto flex items-center gap-1 -me-2.5">
          <ShareButton url={shareUrl} title={title} />
          <BookmarkButton item={saved} />
        </div>
      </div>
    </div>
  );
}
