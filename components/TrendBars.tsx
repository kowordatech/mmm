interface TrendPoint {
  month: string;
  value: number;
}

interface TrendBarsProps {
  label: string;
  points: TrendPoint[];
}

export default function TrendBars({ label, points }: TrendBarsProps) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const lastIndex = points.length - 1;

  return (
    <div className="trend">
      <div className="trend-label">{label}</div>
      <div className="trend-bars">
        {points.map((p, i) => {
          const heightPct = Math.max(4, Math.round((p.value / max) * 100));
          return (
            <div className="trend-col" key={p.month} title={`${p.month}: ${p.value}`}>
              <div
                className={`trend-bar${i === lastIndex ? " current" : ""}`}
                style={{ height: `${heightPct}%` }}
              />
              <div className="trend-tick">{p.month.slice(5)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
