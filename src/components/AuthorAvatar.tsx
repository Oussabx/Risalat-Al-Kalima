import type { Author } from '@/lib/content/types';

const sizes = { sm: 'h-7 w-7 text-[0.7rem]', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' };

/** CMS avatar when present; otherwise the author's initial on a brand tint. */
export function AuthorAvatar({ author, size = 'md', className = '' }: { author: Author; size?: keyof typeof sizes; className?: string }) {
  const initial = author.name.replace(/^ال/, '').trim().charAt(0);
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white ${sizes[size]} ${className}`}>
      {author.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- gravatar/CMS avatars of arbitrary origin
        <img src={author.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  );
}
