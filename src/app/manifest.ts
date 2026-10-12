import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.fullName,
    short_name: 'رسالة الكلمة',
    description: site.shortDescription,
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    categories: ['books', 'education', 'magazines', 'news'],
  };
}
