// STUB — replaced by the global shell builder.
import { Logo } from '../Logo';
import { getIdentity } from '@/lib/content';

export async function SiteHeader() {
  const identity = await getIdentity();
  return (
    <header data-site-header className="border-b border-line bg-white">
      <div className="container-site flex h-16 items-center justify-center">
        <Logo logo={identity.logo} />
      </div>
    </header>
  );
}
