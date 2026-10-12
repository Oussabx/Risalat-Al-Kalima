# رسالة الكلمة — Risalat Al Kalima

A rebuild of the website of **مجلة رسالة الكلمة**, an Arabic Christian quarterly magazine from Lebanon
(<https://risalatalkalima.com>), as a fast, accessible, Arabic-first (RTL) editorial magazine.

The new site runs **headless on top of the magazine's existing WordPress**: articles, authors, categories, tags,
pages, images and the logo are read live from the WordPress REST API, so the editorial team keeps publishing exactly
as today. Nothing editorial is hard-coded or invented.

Stack: Next.js 16 (App Router, React Server Components, ISR), React 19, TypeScript, Tailwind CSS 4,
`sanitize-html`, Vitest, Playwright + axe.

---

## Audit summary

- **The live site could not be reached from the build environment** (network blocked), so it was not crawled or
  screenshotted. Facts about the magazine were taken from the public search-engine index of the site and are kept in
  one place, `src/lib/site.ts`: the self-description (من نحن), the facts shown on the About page, and the 25 menu
  categories.
- **WordPress REST is the source of truth.** Category names in `site.ts` are only matched (by normalised Arabic name)
  to the live WordPress categories; slugs, URLs, counts and all article data come from the CMS.
- **Not verified, therefore not shown unless configured:** social links, contact details (email, phone, address),
  view counts (there are none, so there is no «الأكثر قراءة» — the site uses «مختارات المحرّر» from WordPress sticky
  posts instead), newsletter provider, the logo file (taken from WordPress, never redrawn).
- Legacy WordPress URLs are preserved (`/<slug>/`, `/category/<slug>/`, `/tag/<slug>/`, `/author/<slug>/`, `/feed/`).

## Architecture

```
src/
  app/                 Routes (server components by default, ISR with revalidate = 600)
  components/          UI: shared primitives at the top level, feature folders below
                       (header, footer, home, archive, article, search, saved, about, contact)
  lib/
    site.ts            Site configuration and verified facts (the only hand-maintained content)
    content/           Content layer: one interface, two sources
      types.ts         ContentSource interface and the content model
      wordpress.ts     Production source: WordPress REST (fetches tagged 'wp')
      fixtures*.ts     Preview source (CONTENT_SOURCE=fixtures), clearly labelled
      index.ts         Cached accessors used by pages (getArticle, listArticles, getNavigation…)
    html.ts            Allow-list sanitiser + heading anchors for CMS HTML (always used before rendering)
    arabic.ts          Arabic normalisation, dates («8 أيلول 2026»), reading time, plurals
    search*.ts         Arabic-aware ranking over a cached index of recent articles
    routes.ts          URL builders (trailing slashes, WordPress permalinks)
    rate-limit.ts      Best-effort in-memory limiter for the form endpoints
```

- Pages are static/ISR and refresh every 10 minutes, or immediately through `/api/revalidate`.
- Client components are limited to interactive parts (menu, search overlay, share/bookmark, reading progress, forms).
- Bookmarks («المحفوظات») are stored in the reader's browser (`localStorage`); no account needed.

## Pages and routes

| Route | Purpose |
| --- | --- |
| `/` | Home: lead story, editor's picks (sticky posts), latest, category sections, CTA, newsletter |
| `/<slug>/` | Article (or a WordPress page with the same slug) — same permalink as WordPress |
| `/articles/` | All articles: category filter, sort, pagination (`?category=&sort=&page=`) |
| `/category/<slug>/` | Category archive (sort + pagination) |
| `/tag/<slug>/`, `/author/<slug>/` | Tag and author archives |
| `/search/?q=` | Arabic-aware search with category facets |
| `/picks/` | «مختارات المحرّر» (WordPress sticky posts) |
| `/saved/` | Reader's saved articles (browser storage, `noindex`) |
| `/about/` | من نحن — WordPress page `ABOUT_PAGE_SLUG` if present, plus the verified facts and sections |
| `/contact/` | اتصل بنا — WordPress page content (if any), configured details, contact form |
| `/feed/` | RSS 2.0, latest 20 articles |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | SEO and PWA metadata |
| `POST /api/contact` | Contact form → Contact Form 7 or webhook (rate limit 3/min) |
| `POST /api/newsletter` | Newsletter → Mailchimp, Brevo or MailPoet/webhook (rate limit 5/min) |
| `POST /api/revalidate` | On-demand refresh (secret in header) |
| `GET /api/search` | Search suggestions for the header overlay |

Redirects (`next.config.ts`): `/page/N/` and `/<archive>/<slug>/page/N/` → `?page=N`; `/?s=…` → `/search/?q=…`.

## Design system

Based on the client mockup: clean, airy, white cards with subtle borders, restrained shadows, pill buttons and chips,
line icons.

- **Colour tokens** (`src/app/globals.css`, `@theme`): `brand-50…900` around the logo blue `#3B82F6` (`brand-500`);
  text and filled buttons use `brand-600/700` to meet WCAG AA. Neutrals: `ink #1F2937`, `ink-soft`, `muted`,
  `line`, `line-strong`, `canvas`, `surface #FFFFFF`, `surface-2 #F1F5F9`; `success`, `danger`.
- **Type**: IBM Plex Sans Arabic (self-hosted). `display` 44px, `h1` 32px bold, `h2` 22px semibold, `h3` 18px,
  body 16px, `meta` 13px; generous Arabic line heights. Article body styles live in `.prose-ar`.
- **Shape and depth**: `--radius-card` 14px, `--shadow-card`, `--shadow-lift`, `--shadow-header`.
- **Component classes**: `btn-primary`, `btn-outline`, `btn-ghost`, `btn-light`, `icon-btn`, `chip`, `chip-soft`,
  `badge`, `badge-soft`, `card`, `surface-soft`, `field`, `field-label`, `field-error`, `eyebrow`, `skeleton`.
- **Components**: `Logo`, `ArticleCard` (standard / horizontal / compact / overlay), `PostImage`, `CategoryBadge`,
  `AuthorAvatar`, `PostMeta`, `SectionHeader`, `Breadcrumbs` (with JSON-LD), `Pagination`, `EmptyState`,
  `NewsletterForm`, `Reveal`, plus the feature folders.
- **RTL and accessibility**: logical properties only, `lang="ar" dir="rtl"`, landmarks, skip link, visible focus,
  44px touch targets, focus-trapped dialogs, `prefers-reduced-motion` respected, no overflow at 360px.

## Running locally

Requires Node.js ≥ 20.9.

```bash
npm install
cp .env.example .env.local      # optional for preview, required for production data

npm run dev:preview             # labelled preview data, no WordPress needed
npm run dev                     # live WordPress (WP_API_URL)

npm run lint
npm run typecheck
npm test                        # Vitest unit tests
npm run test:e2e                # Playwright + axe (builds and serves the preview data)
```

End-to-end tests need a Chromium binary. Where Playwright cannot download browsers, point it at an existing one:

```bash
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run test:e2e
```

## Configuration

All variables are documented in [`.env.example`](.env.example).

| Variable | Purpose |
| --- | --- |
| `WP_API_URL` | WordPress REST root, e.g. `https://cms.risalatalkalima.com/wp-json` |
| `WP_REVALIDATE_SECONDS` | Cache lifetime of WordPress responses (default 600) |
| `SEARCH_INDEX_PAGES` | Pages of 100 recent articles in the search index (default 6) |
| `CONTENT_SOURCE` | `fixtures` for preview data (always `noindex`); empty in production |
| `NEXT_PUBLIC_SITE_URL` | Public origin for canonical URLs, sitemap, RSS |
| `NEXT_PUBLIC_LOGO_URL` | Optional URL of the original logo file (else WordPress Site Identity) |
| `ABOUT_PAGE_SLUG`, `CONTACT_PAGE_SLUG` | WordPress pages feeding `/about/` and `/contact/` |
| `NEXT_PUBLIC_SOCIAL_FACEBOOK` / `_X` / `_YOUTUBE` / `_WHATSAPP` | Official social links (only set ones render) |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `_PHONE` / `_ADDRESS` | Official contact details (only set ones render) |
| `REVALIDATE_SECRET` | Secret for `/api/revalidate` |
| `CONTACT_PROVIDER`, `CF7_FORM_ID`, `CONTACT_WEBHOOK_URL` | Contact form delivery |
| `NEWSLETTER_PROVIDER`, `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID`, `BREVO_API_KEY`, `BREVO_LIST_ID`, `NEWSLETTER_WEBHOOK_URL` | Newsletter delivery |
| `PW_CHROMIUM_PATH` | Chromium binary for Playwright (tests only) |

Forms never pretend: when a provider is not configured the API answers `503` and the form says the message was **not**
sent; provider failures answer `502`; success is shown only after a `2xx`.

## Deployment

1. **Keep WordPress as the CMS**, moved to a subdomain (e.g. `cms.risalatalkalima.com`), and point the main domain at
   this app (Vercel or any Node host). Set `WP_API_URL` to the subdomain and `NEXT_PUBLIC_SITE_URL` to the main domain.
   Make sure media URLs stay reachable and their host is allowed in `next.config.ts` (`images.remotePatterns`).
2. **Instant updates**: in WordPress, add a webhook (e.g. WP Webhooks, or a small `save_post` hook) that calls
   `POST https://risalatalkalima.com/api/revalidate/` with the header `x-revalidate-secret: <REVALIDATE_SECRET>`
   (or `Authorization: Bearer <secret>`). The secret is never accepted in the query string. Without the webhook,
   content still refreshes within `WP_REVALIDATE_SECONDS`.
3. **Legacy URLs are preserved**: article, category, tag and author permalinks are identical; `/feed/` still works;
   `/?s=term` redirects to `/search/?q=term`; `/page/N/` style pagination redirects to `?page=N`.
4. Optionally block the WordPress front end on the CMS subdomain (or set it `noindex`) to avoid duplicate content.
5. Submit `https://risalatalkalima.com/sitemap.xml` in Google Search Console.

## What to confirm before launch

- [ ] **Logo**: upload the original logo in WordPress → Appearance → Customise → Site Identity, or set
      `NEXT_PUBLIC_LOGO_URL` to the original file. The logo is never redrawn or recoloured.
- [ ] **Brand colour**: sample the exact blue from the original logo file and adjust `brand-*` tokens if needed
      (currently `#3B82F6` from the mockup).
- [ ] **Social links**: provide the official accounts (`NEXT_PUBLIC_SOCIAL_*`).
- [ ] **Contact details**: official email / phone / address, if they should be public (`NEXT_PUBLIC_CONTACT_*`).
- [ ] **Newsletter provider**: choose Mailchimp, Brevo or MailPoet and set its keys.
- [ ] **Contact form**: the Contact Form 7 form id (`CF7_FORM_ID`) with fields `your-name`, `your-email`,
      `your-subject`, `your-message` — or a webhook.
- [ ] **About / Contact page slugs** in WordPress (`ABOUT_PAGE_SLUG`, `CONTACT_PAGE_SLUG`).
- [ ] **Sticky posts**: mark articles as sticky in WordPress to feed the home hero and «مختارات المحرّر».
- [ ] **Publisher name**: confirm the official form — «كنيسة لبنان الكتابيّة الإنجيليّة» or
      «كنيسة لبنان الإنجيليّة» — before it is used anywhere.
- [ ] `REVALIDATE_SECRET` set and the WordPress webhook tested.

## Preview data

`CONTENT_SOURCE=fixtures` (`npm run dev:preview`) runs the site without WordPress for design review. A banner on every
page announces preview mode; titles, authors and categories are taken from the real site, while article bodies and
images are placeholders that say so. Preview builds are `noindex` and `robots.txt` disallows everything. In production
(no `CONTENT_SOURCE`), every piece of content comes from WordPress.
