/** A friendly "nothing here yet": a small drawing, what is missing, and what to do about it. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty">
      <svg className="empty-art" width="56" height="44" viewBox="0 0 56 44" fill="none" aria-hidden="true" focusable="false">
        <rect x="6" y="14" width="44" height="26" rx="6" fill="var(--badge)" stroke="var(--line-strong)" strokeWidth="1.5" />
        <path d="M6 26h13l3 5h12l3-5h13" stroke="var(--line-strong)" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="28" cy="7" r="3" fill="var(--accent)" opacity="0.55" />
        <path d="M28 12v-1" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      </svg>
      <div className="empty-title">{title}</div>
      {hint && <div className="empty-hint">{hint}</div>}
    </div>
  );
}
