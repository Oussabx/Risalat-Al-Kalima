import Link from 'next/link';
import { AuthorAvatar } from '@/components/AuthorAvatar';
import { formatDate } from '@/lib/arabic';
import type { PostSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';

export function PostMeta({ post, avatar = false, tone = 'muted' }: { post: PostSummary; avatar?: boolean; tone?: 'muted' | 'light' }) {
  const color = tone === 'light' ? 'text-white/85' : 'text-muted';
  return (
    <div className={`relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] ${color}`}>
      {post.author.slug ? (
        <Link href={routes.author(post.author.slug)} className={`inline-flex items-center gap-2 font-medium transition ${tone === 'light' ? 'text-white hover:text-brand-100' : 'text-ink-soft hover:text-brand-700'}`}>
          {avatar && <AuthorAvatar author={post.author} size="sm" />}
          {post.author.name}
        </Link>
      ) : (
        <span className="font-medium">{post.author.name}</span>
      )}
      <span aria-hidden className="opacity-50">|</span>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
    </div>
  );
}
