/**
 * Site-wide configuration.
 *
 * Category names mirror the original site's menu. They are matched to the live
 * WordPress categories by normalised name (diacritics and hamza forms ignored),
 * so real slugs and URLs always come from the CMS rather than from this file.
 */

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

export const site = {
  name: 'رسالة الكلمة',
  fullName: 'مجلة رسالة الكلمة',
  url: (env('NEXT_PUBLIC_SITE_URL') ?? 'https://risalatalkalima.com').replace(/\/$/, ''),
  /** The magazine's own published self-description (من نحن). */
  description:
    '«رسالة الكلمة» مجلّة مسيحيّة فصليّة تتناول الموضوعات الروحيّة والأخلاقيّة والاجتماعيّة من وجهة نظر كتابيّة (بيبليّة)، وتهدف إلى تعزيز إيمان المؤمنين وتقريب البعيدين إلى الله.',
  shortDescription: 'مجلّة مسيحيّة فصليّة تتناول الموضوعات الروحيّة والأخلاقيّة والاجتماعيّة من وجهة نظر كتابيّة.',
  locale: 'ar_LB',
  /** Optional override for the original logo file (absolute URL or a path under /public). */
  logoUrl: env('NEXT_PUBLIC_LOGO_URL'),
  aboutPageSlug: env('ABOUT_PAGE_SLUG') ?? 'من-نحن',
  contactPageSlug: env('CONTACT_PAGE_SLUG') ?? 'اتصل-بنا',
} as const;

/** Facts published by the magazine about itself (من نحن), shown on the About page. */
export const aboutFacts = {
  mission: site.description,
  points: [
    { title: 'مجلّة فصليّة مرخّصة', body: 'تصدر بترخيص من وزارة الإعلام اللبنانيّة.' },
    { title: 'فريق من المتطوّعين', body: 'يرأس تحريرها القسّيس د. إدكار طرابلسي، ويعمل معه نحو أربعين متطوّعًا من كتّاب ومحرّرين ومصوّرين وفريق تسويق وإدارة.' },
    { title: 'كتّاب محليّون وترجمات', body: 'نحو ٧٠٪ من المقالات لكتّاب محليّين، و٣٠٪ ترجمات تعرّف القارئ بالفكر المسيحيّ العالميّ.' },
    { title: 'إيمان إنجيليّ', body: 'تلتزم المجلّة بالإيمان الإنجيليّ: الكتاب المقدّس كلمة الله الموحى بها، والخلاص بالإيمان بالربّ يسوع المسيح وحده.' },
  ],
} as const;

export type SocialKey = 'facebook' | 'x' | 'youtube' | 'whatsapp';
export type SocialLink = { key: SocialKey; label: string; url: string };

/** Only links supplied through the environment are rendered; none are invented. */
export const socialLinks: SocialLink[] = (
  [
    { key: 'facebook', label: 'فيسبوك', url: env('NEXT_PUBLIC_SOCIAL_FACEBOOK') },
    { key: 'x', label: 'إكس', url: env('NEXT_PUBLIC_SOCIAL_X') },
    { key: 'youtube', label: 'يوتيوب', url: env('NEXT_PUBLIC_SOCIAL_YOUTUBE') },
    { key: 'whatsapp', label: 'واتساب', url: env('NEXT_PUBLIC_SOCIAL_WHATSAPP') },
  ] as { key: SocialKey; label: string; url?: string }[]
).filter((link): link is SocialLink => Boolean(link.url));

/** Official contact details, only when configured. */
export const contactDetails = {
  email: env('NEXT_PUBLIC_CONTACT_EMAIL') ?? null,
  phone: env('NEXT_PUBLIC_CONTACT_PHONE') ?? null,
  address: env('NEXT_PUBLIC_CONTACT_ADDRESS') ?? null,
};

/** Every category in the original site's menu. */
export const allCategoryNames = [
  'أخبار مسيحية',
  'الأخلاق المسيحية',
  'الإصلاح الإنجيلي',
  'الحياة والعائلة المسيحية',
  'الدفاعيات المسيحية',
  'العلم والمسيحية',
  'الكتاب المقدس',
  'الكنيسة',
  'اللاهوت النظامي',
  'المؤمن المسيحي',
  'المجتمع والمسيحية',
  'تأملات',
  'تاريخ وشخصيات',
  'ثقافة',
  'حقائق مسيحية',
  'دروس للأولاد',
  'رثاء',
  'فيديو مسيحي',
  'كتب مسيحية',
  'كلمة التحرير',
  'مبادئ مسيحية',
  'مقابلة',
  'من هم',
  'مواضيع شائعة',
  'موسيقى',
] as const;

/** Categories promoted to the desktop bar, in order. */
export const primaryCategoryNames = ['تأملات', 'الكتاب المقدس', 'الحياة والعائلة المسيحية'] as const;

/** Short labels where the bar is tight. */
export const shortLabels: Record<string, string> = {
  'الحياة والعائلة المسيحية': 'الحياة والعائلة',
};

/** The full category list grouped for the mega menu, the drawer and the footer. */
export const categoryGroups: { title: string; names: string[] }[] = [
  {
    title: 'الإيمان والعقيدة',
    names: ['الكتاب المقدس', 'اللاهوت النظامي', 'حقائق مسيحية', 'مبادئ مسيحية', 'الدفاعيات المسيحية', 'الإصلاح الإنجيلي'],
  },
  {
    title: 'الحياة المسيحية',
    names: ['تأملات', 'المؤمن المسيحي', 'الحياة والعائلة المسيحية', 'الأخلاق المسيحية', 'الكنيسة', 'دروس للأولاد'],
  },
  {
    title: 'المجتمع والثقافة',
    names: ['المجتمع والمسيحية', 'العلم والمسيحية', 'ثقافة', 'تاريخ وشخصيات', 'أخبار مسيحية', 'رثاء'],
  },
  {
    title: 'من المجلّة',
    names: ['كلمة التحرير', 'مقابلة', 'من هم', 'مواضيع شائعة', 'فيديو مسيحي', 'كتب مسيحية', 'موسيقى'],
  },
];

/** Homepage editorial sections, each fed by one or more categories (by name). */
export const homeSections: {
  key: string;
  title: string;
  description: string;
  names: string[];
  variant: 'feature' | 'grid' | 'list';
}[] = [
  {
    key: 'reflections',
    title: 'تأمّلات روحيّة',
    description: 'وقفات مع الكلمة تغذّي النفس في زحمة الأيّام.',
    names: ['تأملات'],
    variant: 'feature',
  },
  {
    key: 'bible',
    title: 'الكتاب المقدّس واللاهوت',
    description: 'دراسات كتابيّة وعقائديّة بلغة واضحة وعمق أمين.',
    names: ['الكتاب المقدس', 'اللاهوت النظامي', 'حقائق مسيحية', 'الدفاعيات المسيحية'],
    variant: 'grid',
  },
  {
    key: 'life',
    title: 'الحياة والعائلة',
    description: 'الإيمان في البيت والعمل والعلاقات اليوميّة.',
    names: ['الحياة والعائلة المسيحية', 'المؤمن المسيحي', 'الأخلاق المسيحية'],
    variant: 'grid',
  },
  {
    key: 'people',
    title: 'مقابلات وشخصيّات',
    description: 'وجوه وقصص من تاريخ الكنيسة وحاضرها.',
    names: ['مقابلة', 'تاريخ وشخصيات', 'من هم'],
    variant: 'list',
  },
];

/** Categories that get a media (video) or library (books) treatment. */
export const mediaCategoryNames = ['فيديو مسيحي'];
export const booksCategoryNames = ['كتب مسيحية'];

/** Number of articles per archive page. */
export const PAGE_SIZE = 12;
