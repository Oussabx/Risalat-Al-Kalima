/** Shared class strings for the archive cards and grids. */

/** Card surface with hover lift and a focus ring when its stretched link is focused (matches ArticleCard). */
export const CARD_SHELL =
  'group relative overflow-hidden rounded-(--radius-card) border border-line bg-surface shadow-(--shadow-card) transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-(--shadow-lift) has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500';

/** Title link stretched over the whole card; other links in the card sit above it with `relative z-10`. */
export const STRETCHED_LINK = "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none";

/** Three columns on large screens, two from `sm`, one on phones. */
export const GRID_3 = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6';

/** `sizes` for an image in one cell of GRID_3 inside `container-site`. */
export const GRID_3_SIZES = '(min-width: 1240px) 380px, (min-width: 1024px) 31vw, (min-width: 640px) 50vw, 100vw';

/**
 * Pill used in link rows (filters, sort). Visually 36px tall; the ::after
 * extends the hit area to 44px for touch.
 */
export const PILL_HIT_AREA = "relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']";
