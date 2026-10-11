import { categoriesByName, getSiteInfo } from '@/lib/content';
import { routes } from '@/lib/routes';
import { categoryGroups, primaryCategoryNames, shortLabels, socialLinks } from '@/lib/site';
import { HeaderShell, type NavData } from './HeaderShell';

/** Resolves the original menu against live categories, then hands it to the client shell. */
export async function SiteHeader() {
  const [info, primary, groups] = await Promise.all([
    getSiteInfo(),
    categoriesByName(primaryCategoryNames),
    Promise.all(
      categoryGroups.map(async (g) => ({
        title: g.title,
        links: (await categoriesByName(g.names)).map((c) => ({ label: c.name, href: routes.category(c.slug) })),
      })),
    ),
  ]);

  const nav: NavData = {
    primary: [
      { label: 'الرئيسية', href: routes.home },
      { label: 'المقالات', href: routes.articles() },
      ...primary.map((c) => ({ label: shortLabels[c.name] ?? c.name, href: routes.category(c.slug) })),
    ],
    secondary: [
      { label: 'من نحن', href: routes.about },
      { label: 'اتصل بنا', href: routes.contact },
    ],
    groups: groups.filter((g) => g.links.length > 0),
    social: socialLinks,
  };

  return <HeaderShell nav={nav} logo={info.logo} />;
}
