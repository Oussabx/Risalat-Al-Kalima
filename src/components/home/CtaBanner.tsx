import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/icons';
import { Logo } from '@/components/Logo';
import { Reveal } from '@/components/Reveal';
import type { ImageRef } from '@/lib/content/types';
import { routes } from '@/lib/routes';

/**
 * Deep-blue invitation band over a drawn mountain landscape (inline SVG, no
 * photograph). The original logo sits on its white plate (Logo tone="light").
 */
export function CtaBanner({ logo }: { logo?: ImageRef }) {
  return (
    <section aria-labelledby="home-cta" className="container-site">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[1.5rem] bg-brand-900 px-6 pt-12 pb-40 text-center text-white shadow-(--shadow-lift) sm:rounded-[1.75rem] sm:px-12 sm:pt-16 sm:pb-48 lg:pb-52">
          <MountainScene />
          <Logo logo={logo} tone="light" asLink={false} className="justify-center" />
          <h2 id="home-cta" className="mt-6 text-[2rem] leading-[1.35] font-bold sm:text-display">
            كلمة تحيي القلب
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white sm:text-lg">مقالات، تأمّلات، وشهادات ملهمة لحياة مليئة بالرجاء</p>
          <Link href={routes.articles()} className="btn-light mt-8 min-h-12 px-7 shadow-[0_10px_30px_-12px_rgb(15_23_42/0.6)]">
            اكتشف المزيد
            <ArrowLeftIcon width={18} height={18} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/**
 * Layered ranges under a deep-blue sky, with a valley behind the text. Anchored
 * to the bottom and cropped at the sides on narrow screens.
 */
function MountainScene() {
  return (
    <svg
      className="absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="home-cta-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#13265c" />
          <stop offset="0.5" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#4f8ff7" />
        </linearGradient>
        <radialGradient id="home-cta-glow" cx="0.5" cy="0.8" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="home-cta-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9cc0fb" stopOpacity="0.5" />
          <stop offset="1" stopColor="#609df8" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="home-cta-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b78ee" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="home-cta-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f47b8" />
          <stop offset="1" stopColor="#1a3891" />
        </linearGradient>
        <linearGradient id="home-cta-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#152c6b" />
          <stop offset="1" stopColor="#0f214f" />
        </linearGradient>
        <linearGradient id="home-cta-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1440" height="640" fill="url(#home-cta-sky)" />
      <rect width="1440" height="640" fill="url(#home-cta-glow)" />

      {/* Far range */}
      <path
        fill="url(#home-cta-far)"
        d="M0 416 L22 401 L45 393 L68 375 L90 357 L112 341 L135 327 L158 310 L180 301 L202 305 L225 316 L248 326 L270 339 L292 344 L315 357 L338 365 L360 378 L382 392 L405 399 L428 403 L450 405 L472 406 L495 402 L518 404 L540 398 L562 395 L585 383 L608 369 L630 372 L652 379 L675 385 L698 396 L720 394 L742 398 L765 400 L788 393 L810 380 L832 372 L855 358 L878 345 L900 358 L922 367 L945 375 L968 387 L990 393 L1012 396 L1035 397 L1058 389 L1080 383 L1102 381 L1125 370 L1148 354 L1170 344 L1192 334 L1215 313 L1238 301 L1260 293 L1282 295 L1305 317 L1328 344 L1350 362 L1372 373 L1395 389 L1418 399 L1440 405 V640 H0 Z"
      />
      {/* Middle range with a light ridge line */}
      <path
        fill="url(#home-cta-mid)"
        d="M0 479 L22 471 L45 470 L68 475 L90 475 L112 473 L135 476 L158 468 L180 465 L202 458 L225 454 L248 454 L270 444 L292 436 L315 425 L338 423 L360 412 L382 399 L405 395 L428 404 L450 410 L472 411 L495 418 L518 425 L540 428 L562 430 L585 434 L608 432 L630 434 L652 428 L675 416 L698 410 L720 404 L742 402 L765 419 L788 427 L810 435 L832 440 L855 438 L878 437 L900 431 L922 416 L945 404 L968 396 L990 383 L1012 370 L1035 358 L1058 346 L1080 358 L1102 373 L1125 388 L1148 402 L1170 410 L1192 426 L1215 444 L1238 451 L1260 463 L1282 466 L1305 462 L1328 467 L1350 469 L1372 466 L1395 469 L1418 468 L1440 468 V640 H0 Z"
      />
      <path
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.16"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        d="M0 479 L22 471 L45 470 L68 475 L90 475 L112 473 L135 476 L158 468 L180 465 L202 458 L225 454 L248 454 L270 444 L292 436 L315 425 L338 423 L360 412 L382 399 L405 395 L428 404 L450 410 L472 411 L495 418 L518 425 L540 428 L562 430 L585 434 L608 432 L630 434 L652 428 L675 416 L698 410 L720 404 L742 402 L765 419 L788 427 L810 435 L832 440 L855 438 L878 437 L900 431 L922 416 L945 404 L968 396 L990 383 L1012 370 L1035 358 L1058 346 L1080 358 L1102 373 L1125 388 L1148 402 L1170 410 L1192 426 L1215 444 L1238 451 L1260 463 L1282 466 L1305 462 L1328 467 L1350 469 L1372 466 L1395 469 L1418 468 L1440 468"
      />
      <rect y="470" width="1440" height="96" fill="url(#home-cta-mist)" />
      {/* Near range */}
      <path
        fill="url(#home-cta-near)"
        d="M0 511 L22 504 L45 496 L68 487 L90 478 L112 490 L135 500 L158 507 L180 514 L202 520 L225 527 L248 533 L270 534 L292 532 L315 532 L338 531 L360 528 L382 529 L405 525 L428 528 L450 527 L472 526 L495 523 L518 524 L540 521 L562 519 L585 516 L608 510 L630 502 L652 498 L675 495 L698 493 L720 489 L742 483 L765 483 L788 487 L810 491 L832 495 L855 496 L878 497 L900 500 L922 504 L945 510 L968 509 L990 512 L1012 513 L1035 518 L1058 518 L1080 522 L1102 525 L1125 525 L1148 529 L1170 532 L1192 531 L1215 535 L1238 538 L1260 534 L1282 525 L1305 519 L1328 510 L1350 503 L1372 495 L1395 488 L1418 500 L1440 509 V640 H0 Z"
      />
      {/* Foreground hills */}
      <path
        fill="url(#home-cta-front)"
        d="M0 600 C160 566 300 590 440 584 C600 576 700 612 860 600 C1020 588 1140 566 1290 582 C1360 590 1410 596 1440 592 V640 H0 Z"
      />
    </svg>
  );
}
