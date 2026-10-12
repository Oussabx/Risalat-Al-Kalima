import Link from 'next/link';
import { CloseIcon, SearchIcon } from '../icons';

/**
 * GET search form (works without JavaScript). Extra filters travel as hidden
 * fields; the clear link returns to `clearHref` and only shows with a query.
 */
export function SearchForm({
  id,
  action,
  q,
  label,
  placeholder,
  hidden = {},
  clearHref,
  size = 'md',
  autoFocus = false,
  className = '',
}: {
  id: string;
  action: string;
  q: string;
  label: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
  clearHref?: string;
  size?: 'md' | 'lg';
  autoFocus?: boolean;
  className?: string;
}) {
  const lg = size === 'lg';
  return (
    <form action={action} method="get" role="search" aria-label={label} className={`flex flex-col gap-2.5 sm:flex-row ${className}`}>
      <div className="relative min-w-0 flex-1">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <SearchIcon width={lg ? 22 : 20} height={lg ? 22 : 20} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          maxLength={100}
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
          autoFocus={autoFocus}
          className={`field ps-12 shadow-(--shadow-card) [&::-webkit-search-cancel-button]:appearance-none ${q && clearHref ? 'pe-14' : ''} ${lg ? 'min-h-14 text-[1.0625rem]' : 'min-h-12'}`}
        />
        {q && clearHref ? (
          <Link href={clearHref} aria-label="مسح البحث" className="icon-btn absolute end-1 top-1/2 -translate-y-1/2">
            <CloseIcon width={18} height={18} />
          </Link>
        ) : null}
      </div>
      {Object.entries(hidden).map(([name, value]) => (value ? <input key={name} type="hidden" name={name} value={value} /> : null))}
      <button type="submit" className={`btn-primary ${lg ? 'min-h-14 px-8 text-base' : 'min-h-12 px-6'}`}>
        <SearchIcon width={18} height={18} />
        بحث
      </button>
    </form>
  );
}
