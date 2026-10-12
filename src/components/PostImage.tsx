import Image from 'next/image';
import type { ImageRef } from '@/lib/content/types';
import { canOptimize } from '@/lib/images';
import { BookIcon } from './icons';

/**
 * Article image in a fixed-ratio frame (no layout shift). Falls back to a quiet
 * branded panel when an article has no featured image.
 */
export function PostImage({
  image,
  sizes,
  priority = false,
  ratio = 'aspect-[16/10]',
  className = '',
  zoom = false,
}: {
  image?: ImageRef;
  sizes: string;
  priority?: boolean;
  ratio?: string;
  className?: string;
  zoom?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${ratio} ${zoom ? 'img-zoom' : ''} ${className}`}>
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!canOptimize(image.src)}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200" aria-hidden="true">
          <BookIcon width={40} height={40} className="text-brand-400" />
        </div>
      )}
    </div>
  );
}
