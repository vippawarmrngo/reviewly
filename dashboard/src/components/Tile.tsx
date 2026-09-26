import { Icon, type IconName } from "./Icon";

export function Tile({ label, value, hint, icon, tone }: { label: string; value: string; hint?: string; icon: IconName; tone?: "good" | "bad" | "neutral" }) {
  return (
    <div className="tile">
      <div className={tone ? `tile-icon ${tone}` : "tile-icon"}>
        <Icon name={icon} size={15} />
      </div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
