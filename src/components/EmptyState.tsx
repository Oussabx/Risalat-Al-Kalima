import { BookIcon } from './icons';

/** Friendly empty result block with an optional action. */
export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center sm:py-16">
      <span className="mb-5 inline-flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">{icon ?? <BookIcon width={26} height={26} />}</span>
      <h2 className="text-h3 font-bold text-ink">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-base leading-relaxed text-muted [overflow-wrap:anywhere]">{description}</p> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
