"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import StatTile from "@/components/StatTile";
import Meter from "@/components/Meter";
import FunnelChart from "@/components/FunnelChart";
import TrendBars from "@/components/TrendBars";
import type { CalendarDoc, MonthlyResult, PostedMap, ResultsMap, StateResponse } from "@/types/calendar";

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const emptyResult: MonthlyResult = { dms: 0, demos: 0, signups: 0, revenue: 0, notes: "" };

export default function DashboardPage() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [posted, setPosted] = useState<PostedMap>({});
  const [results, setResults] = useState<ResultsMap>({});
  const [cal, setCal] = useState<CalendarDoc | null>(null);
  const [month, setMonth] = useState("");
  const [form, setForm] = useState<MonthlyResult>(emptyResult);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const [s, p, r] = await Promise.all([
        api<StateResponse>("/api/state"),
        api<PostedMap>("/api/posted"),
        api<ResultsMap>("/api/results"),
      ]);
      setState(s);
      setPosted(p);
      setResults(r);
      setMonth(s.today.slice(0, 7));
    })();
  }, []);

  useEffect(() => {
    if (!month) return;
    setForm({ ...emptyResult, ...results[month] });
    api<CalendarDoc>(`/api/calendar/${month}`)
      .then(setCal)
      .catch(() => setCal(null));
  }, [month, results]);

  const monthOptions = useMemo(() => {
    if (!state) return [];
    const set = new Set<string>([state.today.slice(0, 7), ...state.months, ...Object.keys(results)]);
    return Array.from(set).sort().reverse();
  }, [state, results]);

  const trendMonths = useMemo(() => [...monthOptions].reverse().slice(-6), [monthOptions]);

  const execution = useMemo(() => {
    if (!state || !cal) return null;
    const allPosts = (cal.weeks || []).flatMap((w) => w.posts || []);
    const due = allPosts.filter((p) => p.date <= state.today);
    const postedDue = due.filter((p) => posted[`${p.date}|${p.channel}`]);
    const overdue = due.filter((p) => !posted[`${p.date}|${p.channel}`]);
    const weekEnd = addDays(state.today, 7);
    const upcoming = allPosts.filter(
      (p) => p.date > state.today && p.date <= weekEnd && !posted[`${p.date}|${p.channel}`]
    );
    return { total: allPosts.length, due: due.length, postedDue: postedDue.length, overdue: overdue.length, upcoming: upcoming.length };
  }, [state, cal, posted]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api<{ ok: boolean; results: MonthlyResult }>("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, ...form }),
      });
      setResults({ ...results, [month]: r.results });
      toast("Results saved");
    } finally {
      setSaving(false);
    }
  };

  const setNum = (key: keyof MonthlyResult) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value === "" ? 0 : Number(e.target.value) });

  if (!state) return null;

  const dms = results[month]?.dms ?? 0;
  const demos = results[month]?.demos ?? 0;
  const signups = results[month]?.signups ?? 0;
  const revenue = results[month]?.revenue ?? 0;

  return (
    <>
      <h2>Dashboard</h2>
      <p className="sub">Business outcomes and content execution, month by month.</p>

      <div className="inline" style={{ marginBottom: 20 }}>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ maxWidth: 160 }}>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="kpi-grid">
        <StatTile label="DMs" value={String(dms)} />
        <StatTile label="Demos" value={String(demos)} />
        <StatTile label="Sign-ups" value={String(signups)} status="good" />
        <StatTile label="Revenue" value={revenue ? `GHS ${revenue.toLocaleString()}` : "—"} />
        {execution ? (
          <>
            <StatTile
              label="Posted so far"
              value={`${execution.postedDue}/${execution.due}`}
              sub={`${execution.total} generated this month`}
            />
            <StatTile
              label="Overdue"
              value={String(execution.overdue)}
              status={execution.overdue === 0 ? "good" : "critical"}
              sub={execution.overdue === 0 ? "All caught up" : "not marked posted"}
            />
          </>
        ) : (
          <StatTile label="Posted so far" value="—" sub="No calendar generated for this month yet" />
        )}
      </div>

      {execution && execution.due > 0 && (
        <Meter
          label="Posting completion"
          value={execution.postedDue}
          max={execution.due}
          status={execution.postedDue === execution.due ? "good" : execution.overdue > 3 ? "critical" : "warning"}
        />
      )}

      <h2 style={{ fontSize: 16, marginTop: 8 }}>Conversion funnel</h2>
      <FunnelChart
        stages={[
          { label: "DMs", value: dms },
          { label: "Demos", value: demos },
          { label: "Sign-ups", value: signups },
        ]}
      />

      <h2 style={{ fontSize: 16, marginTop: 26 }}>Last {trendMonths.length} months</h2>
      <div className="trend-grid">
        <TrendBars label="DMs" points={trendMonths.map((m) => ({ month: m, value: results[m]?.dms ?? 0 }))} />
        <TrendBars label="Demos" points={trendMonths.map((m) => ({ month: m, value: results[m]?.demos ?? 0 }))} />
        <TrendBars label="Sign-ups" points={trendMonths.map((m) => ({ month: m, value: results[m]?.signups ?? 0 }))} />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="results-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>DMs</th>
              <th>Demos</th>
              <th>Sign-ups</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {trendMonths
              .slice()
              .reverse()
              .map((m) => (
                <tr key={m}>
                  <td>{m}</td>
                  <td>{results[m]?.dms ?? 0}</td>
                  <td>{results[m]?.demos ?? 0}</td>
                  <td>{results[m]?.signups ?? 0}</td>
                  <td>{results[m]?.revenue ?? 0}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 16 }}>Log {month}&apos;s results</h2>
      <p className="sub">Saved to results.json — feeds the KPIs and trend above.</p>
      <div className="inline" style={{ gap: 16, marginBottom: 16 }}>
        <div className="field" style={{ flex: "1 1 100px" }}>
          <label htmlFor="rDms">DMs</label>
          <input id="rDms" type="number" min={0} value={form.dms ?? 0} onChange={setNum("dms")} />
        </div>
        <div className="field" style={{ flex: "1 1 100px" }}>
          <label htmlFor="rDemos">Demos</label>
          <input id="rDemos" type="number" min={0} value={form.demos ?? 0} onChange={setNum("demos")} />
        </div>
        <div className="field" style={{ flex: "1 1 100px" }}>
          <label htmlFor="rSignups">Sign-ups</label>
          <input id="rSignups" type="number" min={0} value={form.signups ?? 0} onChange={setNum("signups")} />
        </div>
        <div className="field" style={{ flex: "1 1 100px" }}>
          <label htmlFor="rRevenue">Revenue (GHS)</label>
          <input id="rRevenue" type="number" min={0} value={form.revenue ?? 0} onChange={setNum("revenue")} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="rNotes">Notes (what worked, what didn&apos;t)</label>
        <textarea
          id="rNotes"
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
      <button className="btn primary" disabled={saving} onClick={save}>
        Save results
      </button>
    </>
  );
}
