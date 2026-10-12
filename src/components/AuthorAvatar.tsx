import Image from 'next/image';
import type { Author } from '@/lib/content/types';
import { canOptimize } from '@/lib/images';

/** Author photo from WordPress, or the author's initial when no photo exists. */
export function AuthorAvatar({ author, size = 32, className = '' }: { author: Pick<Author, 'name' | 'avatar'>; size?: number; className?: string }) {
  if (author.avatar) {
    return (
      <Image
        src={author.avatar}
        alt=""
        width={size}
        height={size}
        unoptimized={!canOptimize(author.avatar)}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = author.name.replace(/^(ال)/, '').trim().charAt(0) || '؟';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initial}
    </span>
  );
}
