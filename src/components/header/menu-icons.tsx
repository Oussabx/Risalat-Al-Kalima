import type { SVGProps } from 'react';

/** Two extra line icons for the menus, drawn on the same 24px grid and 1.8 stroke as `components/icons.tsx`. */

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}

export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m12 3.8 2.5 5.1 5.6.8-4.05 3.95.95 5.6L12 16.6l-5 2.65.95-5.6L3.9 9.7l5.6-.8Z" />
  </Svg>
);

export const InfoIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.9v.2" />
  </Svg>
);
