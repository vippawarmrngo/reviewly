import { CountUp } from "../motion/CountUp";
import { Icon, type IconName } from "./Icon";

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  tone?: "good" | "bad" | "neutral";
  /** When given, the number counts up on first view. `value` is what is shown without motion. */
  count?: { value: number; format: (n: number) => string };
}

export function Tile({ label, value, hint, icon, tone, count }: Props) {
  return (
    <div className="tile">
      <div className={tone ? `tile-icon ${tone}` : "tile-icon"}>
        <Icon name={icon} size={15} />
      </div>
      <div className="label">{label}</div>
      <div className="value">{count ? <CountUp value={count.value} format={count.format} /> : value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
