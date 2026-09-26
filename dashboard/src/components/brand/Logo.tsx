import { useId } from "react";

/** The Reviewly mark: a rounded square with a check that closes into a review "tick". One source for the
 *  header, footer, favicon and social image (public/favicon.svg is the same drawing). */
export function LogoMark({ size = 26 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Reviewly" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <path d="M9 16.5l5 5 9-10.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="brand">
      <LogoMark size={size} />
      <span className="wordmark">Reviewly</span>
    </span>
  );
}
