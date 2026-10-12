import Link from 'next/link';
import type { ImageRef } from '@/lib/content/types';
import { site } from '@/lib/site';

/**
 * The magazine's ORIGINAL logo, used as-is from WordPress (Site Identity →
 * site_logo) or from NEXT_PUBLIC_LOGO_URL. It is never redrawn or recoloured.
 * Until the original file is available, the plain name is shown as text — a
 * clearly temporary label, not an imitation of the logo.
 */
export function Logo({
  logo,
  size = 'md',
  tone = 'brand',
  asLink = true,
  className = '',
}: {
  logo?: ImageRef;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'brand' | 'light';
  asLink?: boolean;
  className?: string;
}) {
  const height = size === 'lg' ? 56 : size === 'sm' ? 34 : 44;
  const content = logo ? (
    // eslint-disable-next-line @next/next/no-img-element -- the original asset is shown untouched, in any format (SVG/PNG) and from any host
    <img
      src={logo.src}
      alt={site.fullName}
      height={height}
      width={logo.width && logo.height ? Math.round((logo.width / logo.height) * height) : undefined}
      style={{ height, width: 'auto' }}
      className="block max-w-[220px] object-contain"
      decoding="async"
      fetchPriority="high"
    />
  ) : (
    <span
      className={`block font-bold leading-none tracking-tight whitespace-nowrap ${tone === 'light' ? 'text-white' : 'text-brand-600'} ${
        size === 'lg' ? 'text-[2.1rem]' : size === 'sm' ? 'text-[1.35rem]' : 'text-[1.7rem]'
      }`}
      data-logo-fallback
    >
      {site.name}
    </span>
  );

  // On dark backgrounds the untouched logo sits on a white plate instead of being recoloured.
  const plated = logo && tone === 'light' ? <span className="inline-flex rounded-xl bg-white px-3 py-2 shadow-sm">{content}</span> : content;

  if (!asLink) return <span className={`inline-flex items-center ${className}`}>{plated}</span>;
  return (
    <Link href="/" aria-label={`${site.fullName} — الصفحة الرئيسية`} className={`inline-flex items-center rounded-lg ${className}`}>
      {plated}
    </Link>
  );
}
