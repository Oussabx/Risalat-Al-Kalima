/**
 * List item separated by hairlines in a one-column (mobile) or two-column (md+)
 * list. The parent list cancels the outer padding with `-my-5`.
 */
export const RULED_ITEM = 'border-b border-line py-5 last:border-b-0 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0';

/** Focus ring and hover lift shared by the homepage's custom cards (matches ArticleCard). */
export const CARD_SHELL =
  'group relative overflow-hidden rounded-(--radius-card) border border-line bg-surface shadow-(--shadow-card) transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-(--shadow-lift) has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500';

/** Title link stretched over the whole card (other links inside sit above it with z-10). */
export const STRETCHED_LINK = "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none";

/**
 * Card grid that becomes a swipeable row on phones (the next card peeks in) and
 * a regular grid from `sm` up. `columns` adds the grid columns, e.g. 'sm:grid-cols-2 lg:grid-cols-4'.
 * The vertical padding keeps card shadows from being clipped by the scroll box.
 */
export function cardRowClass(count: number, columns: string): string {
  if (count < 2) return `grid gap-5 lg:gap-6 ${columns}`;
  return `no-scrollbar -mx-4 -my-3 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-3 sm:mx-0 sm:my-0 sm:grid sm:snap-none sm:gap-5 sm:overflow-visible sm:p-0 lg:gap-6 ${columns}`;
}

export function cardRowItemClass(count: number): string {
  return count < 2 ? '' : 'w-[82%] max-w-[22rem] shrink-0 snap-start sm:w-auto sm:max-w-none';
}
