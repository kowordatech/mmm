type Status = "good" | "warning" | "critical";

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  status?: Status;
}

export default function StatTile({ label, value, sub, status }: StatTileProps) {
  return (
    <div className={`stat-tile${status ? ` ${status}` : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
