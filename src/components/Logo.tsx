import type { Image } from '@/lib/content/types';

/**
 * Renders the magazine's own logo file as served by WordPress (or the
 * NEXT_PUBLIC_LOGO_URL override). Nothing is redrawn: if no logo file is
 * available the site name is set in plain type instead.
 */
export function Logo({ logo, className = 'h-10 sm:h-12' }: { logo?: Image; className?: string }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo may be SVG/PNG from the CMS; keep the original file untouched
      <img src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className={`${className} w-auto`} />
    );
  }
  return (
    <span data-logo-fallback className="text-2xl font-bold tracking-tight text-brand-600 sm:text-[1.7rem]">
      رسالة الكلمة
    </span>
  );
}
