import NextImage from 'next/image';
import type { Image } from '@/lib/content/types';

/** Cover image with a quiet branded backdrop when an article has no featured image. */
export function PostImage({
  image,
  sizes,
  priority = false,
  className = '',
}: {
  image?: Image;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!image) {
    return (
      <div aria-hidden className={`absolute inset-0 bg-gradient-to-br from-brand-100 via-brand-50 to-white ${className}`}>
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_30%_20%,var(--color-brand-200),transparent_60%)]" />
      </div>
    );
  }
  return (
    <NextImage
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={image.placeholder || image.src.endsWith('.svg')}
      className={`object-cover ${className}`}
    />
  );
}
