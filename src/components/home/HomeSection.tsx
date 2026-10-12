import { Reveal } from '@/components/Reveal';
import { SectionHeader } from '@/components/SectionHeader';

/**
 * A homepage section: labelled landmark, site container, section header and a
 * gentle entrance. Pass `revealBody={false}` when the body reveals its own items.
 */
export function HomeSection({
  id,
  title,
  description,
  href,
  linkLabel,
  revealBody = true,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  revealBody?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="container-site">
      <Reveal>
        <SectionHeader id={id} title={title} description={description} href={href} linkLabel={linkLabel} />
      </Reveal>
      {revealBody ? <Reveal delay={90}>{children}</Reveal> : children}
    </section>
  );
}
