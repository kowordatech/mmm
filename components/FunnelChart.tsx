interface FunnelStage {
  label: string;
  value: number;
}

// Validated ordinal ramp (single hue, monotone lightness): see dataviz skill.
const RAMP = ["#6FB58C", "#3E8A63", "#0B5C3F"];

export default function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="funnel">
      {stages.map((s, i) => {
        const widthPct = Math.max(4, Math.round((s.value / max) * 100));
        const prev = i > 0 ? stages[i - 1] : null;
        const rate = prev && prev.value > 0 ? Math.round((s.value / prev.value) * 100) : null;
        return (
          <div key={s.label}>
            <div className="funnel-row">
              <div className="funnel-label">{s.label}</div>
              <div className="funnel-track">
                <div
                  className="funnel-bar"
                  style={{ width: `${widthPct}%`, background: RAMP[i % RAMP.length] }}
                />
              </div>
              <div className="funnel-value">{s.value}</div>
            </div>
            {rate !== null && (
              <div className="funnel-rate">
                {rate}% conversion from {prev!.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
