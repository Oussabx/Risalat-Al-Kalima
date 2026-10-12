import { getIdentity, getNavigation, type Category } from '@/lib/content';
import { routes } from '@/lib/routes';
import { shortLabels, socialLinks } from '@/lib/site';
import { Logo } from '../Logo';
import { HeaderBar } from './HeaderBar';
import type { HeaderNavigation, NavLink } from './nav';

const toLink = (category: Category): NavLink => ({
  label: shortLabels[category.name] ?? category.name,
  name: category.name,
  href: routes.category(category.slug),
});

/**
 * Site header (server). Reads the identity (original logo) and the live
 * category navigation, then hands plain data to the interactive HeaderBar.
 */
export async function SiteHeader() {
  const [identity, navigation] = await Promise.all([getIdentity(), getNavigation()]);
  const nav: HeaderNavigation = {
    primary: navigation.primary.map(toLink),
    groups: navigation.groups.map((group) => ({ title: group.title, links: group.categories.map(toLink) })),
  };
  return (
    <HeaderBar
      logo={<Logo logo={identity.logo} className="min-h-11" />}
      drawerLogo={<Logo logo={identity.logo} size="sm" className="min-h-11" />}
      navigation={nav}
      social={socialLinks}
    />
  );
}
