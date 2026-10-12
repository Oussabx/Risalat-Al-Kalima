import { MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons';

type Details = { email: string | null; phone: string | null; address: string | null };
type Item = { key: string; label: string; value: string; href?: string; ltr?: boolean; Icon: typeof MailIcon };

/**
 * The magazine's official contact details — only those configured through the
 * environment (`contactDetails` in lib/site). Renders nothing when none are set.
 */
export function ContactDetails({ details, className = '' }: { details: Details; className?: string }) {
  const items: Item[] = [];
  if (details.email) items.push({ key: 'email', label: 'البريد الإلكترونيّ', value: details.email, href: `mailto:${details.email}`, ltr: true, Icon: MailIcon });
  if (details.phone) items.push({ key: 'phone', label: 'الهاتف', value: details.phone, href: `tel:${details.phone.replace(/[^\d+]/g, '')}`, ltr: true, Icon: PhoneIcon });
  if (details.address) items.push({ key: 'address', label: 'العنوان', value: details.address, Icon: MapPinIcon });
  if (!items.length) return null;

  return (
    <section aria-labelledby="contact-details" className={`card p-6 ${className}`}>
      <h2 id="contact-details" className="text-h3 font-bold text-ink">
        معلومات التواصل
      </h2>
      <address className="mt-4 not-italic">
        <ul className="flex flex-col gap-4">
          {items.map(({ key, label, value, href, ltr, Icon }) => {
            const body = (
              <>
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600" aria-hidden="true">
                  <Icon width={20} height={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col pt-0.5">
                  <span className="text-meta text-muted">{label}</span>
                  <span
                    dir={ltr ? 'ltr' : undefined}
                    className={`leading-relaxed font-semibold text-ink transition-colors [overflow-wrap:anywhere] group-hover:text-brand-700 ${ltr ? 'text-end' : ''}`}
                  >
                    {value}
                  </span>
                </span>
              </>
            );
            return (
              <li key={key}>
                {href ? (
                  <a href={href} className="group flex items-start gap-3 rounded-xl">
                    {body}
                  </a>
                ) : (
                  <div className="flex items-start gap-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </address>
    </section>
  );
}
