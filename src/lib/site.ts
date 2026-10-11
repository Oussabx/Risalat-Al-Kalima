/**
 * Site-wide configuration. Category names mirror the original site's menu;
 * they are matched to live WordPress categories by (normalised) name, so the
 * real slugs and URLs come from the CMS rather than being guessed here.
 */

export const site = {
  name: 'رسالة الكلمة',
  fullName: 'مجلة رسالة الكلمة',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://risalatalkalima.com').replace(/\/$/, ''),
  // The magazine's own self-description (من نحن).
  description:
    '«رسالة الكلمة» مجلّة مسيحيّة فصليّة تتناول الموضوعات الروحيّة والأخلاقيّة والاجتماعيّة من وجهة نظر كتابيّة (بيبليّة)، وتهدف إلى تعزيز إيمان المؤمنين وتقريب البعيدين إلى الله.',
  tagline: 'مجلّة مسيحيّة فصليّة',
  locale: 'ar_LB',
};

export type SocialKey = 'facebook' | 'x' | 'youtube' | 'whatsapp';

/** Only links supplied through the environment are rendered; none are invented. */
export const socialLinks: { key: SocialKey; label: string; url: string }[] = (
  [
    { key: 'facebook', label: 'فيسبوك', url: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK },
    { key: 'x', label: 'إكس', url: process.env.NEXT_PUBLIC_SOCIAL_X },
    { key: 'youtube', label: 'يوتيوب', url: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE },
    { key: 'whatsapp', label: 'واتساب', url: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP },
  ] as { key: SocialKey; label: string; url?: string }[]
).filter((l): l is { key: SocialKey; label: string; url: string } => Boolean(l.url));

export const contactDetails = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || null,
};

/** Top-level links shown directly in the desktop bar (besides the categories menu). */
export const primaryCategoryNames = ['تأملات', 'الكتاب المقدس', 'الحياة والعائلة المسيحية'] as const;

/** Short labels for long category names where the bar is tight. */
export const shortLabels: Record<string, string> = {
  'الحياة والعائلة المسيحية': 'الحياة والعائلة',
};

/** The full category list from the original site, grouped for the mega menu and drawer. */
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
    title: 'من المجلة',
    names: ['كلمة التحرير', 'مقابلة', 'مواضيع شائعة', 'من هم', 'فيديو مسيحي', 'كتب مسيحية', 'موسيقى'],
  },
];

/** Homepage editorial sections, each fed by one or more categories (by name). */
export const homeSections: { title: string; description: string; names: string[]; variant: 'grid' | 'feature' | 'list' }[] = [
  {
    title: 'تأملات روحيّة',
    description: 'وقفات قصيرة مع الكلمة لتغذية النفس في زحمة الأيام.',
    names: ['تأملات'],
    variant: 'feature',
  },
  {
    title: 'الكتاب المقدّس واللاهوت',
    description: 'دراسات كتابيّة وعقائديّة بلغة واضحة وعمق أمين.',
    names: ['الكتاب المقدس', 'اللاهوت النظامي', 'حقائق مسيحية', 'الدفاعيات المسيحية'],
    variant: 'grid',
  },
  {
    title: 'الحياة والعائلة',
    description: 'الإيمان في البيت والعمل والعلاقات اليوميّة.',
    names: ['الحياة والعائلة المسيحية', 'المؤمن المسيحي', 'الأخلاق المسيحية'],
    variant: 'grid',
  },
  {
    title: 'مقابلات وشخصيّات',
    description: 'وجوه وقصص من تاريخ الكنيسة وحاضرها.',
    names: ['مقابلة', 'تاريخ وشخصيات', 'من هم'],
    variant: 'list',
  },
];

export const mediaCategoryNames = ['فيديو مسيحي'];
export const booksCategoryNames = ['كتب مسيحية'];
