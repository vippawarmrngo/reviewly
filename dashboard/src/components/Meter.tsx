/** A bar whose fill is the value and whose track is the lighter step behind it. */
export type Tone = "good" | "warn" | "bad";

export function Meter({ value, label, tone }: { value: number; label: string; tone?: Tone }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      className={tone ? `meter ${tone}` : "meter"}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <span style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}
