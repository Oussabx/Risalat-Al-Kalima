import type { SocialKey, SocialLink } from '@/lib/site';
import { FacebookIcon, WhatsappIcon, XIcon, YoutubeIcon } from '../icons';

const ICONS: Record<SocialKey, typeof FacebookIcon> = {
  facebook: FacebookIcon,
  x: XIcon,
  youtube: YoutubeIcon,
  whatsapp: WhatsappIcon,
};

/**
 * The magazine's social accounts. Only links configured through the
 * environment (`socialLinks` in lib/site) are passed in; nothing is invented.
 */
export function SocialLinks({ links, className = '' }: { links: SocialLink[]; className?: string }) {
  if (!links.length) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {links.map((link) => {
        const Icon = ICONS[link.key];
        return (
          <li key={link.key}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition-colors duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <Icon width={18} height={18} />
              <span className="sr-only">{link.label} (يُفتح في نافذة جديدة)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
