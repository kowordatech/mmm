type Status = "good" | "warning" | "critical";

interface MeterProps {
  label: string;
  value: number;
  max: number;
  status?: Status;
}

export default function Meter({ label, value, max, status = "good" }: MeterProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="meter">
      <div className="meter-label">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="meter-track">
        <div className={`meter-fill ${status}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
