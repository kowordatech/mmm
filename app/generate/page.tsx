"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { StateResponse } from "@/types/calendar";

interface GenerateResult {
  ok: boolean;
  code: number | null;
  log: string;
}

export default function GeneratePage() {
  const [hasApiKey, setHasApiKey] = useState(true);
  const [target, setTarget] = useState<"next" | "this">("next");
  const [log, setLog] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api<StateResponse>("/api/state").then((s) => setHasApiKey(s.hasApiKey));
  }, []);

  const run = async (payload: { dryRun?: boolean; thisMonth?: boolean }) => {
    setRunning(true);
    setLog("Running…");
    try {
      const r = await api<GenerateResult>("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setLog(r.log || "(no output)");
      if (r.ok && !payload.dryRun) toast("Calendar generated");
    } catch (e) {
      setLog("Error: " + (e as Error).message);
    }
    setRunning(false);
  };

  return (
    <>
      <h2>Generate a calendar</h2>
      <p className="sub">Two API calls: content generation, then a QA review pass. Takes about a minute.</p>
      {!hasApiKey && (
        <div className="banner warn">
          ANTHROPIC_API_KEY isn&apos;t set in the environment running this server — only dry runs
          will work. Set it, restart the server, and refresh.
        </div>
      )}
      <div className="inline" style={{ marginBottom: 14 }}>
        <select value={target} onChange={(e) => setTarget(e.target.value as "next" | "this")}>
          <option value="next">Next month</option>
          <option value="this">This month</option>
        </select>
        <button
          className="btn primary"
          disabled={running}
          onClick={() => run({ thisMonth: target === "this" })}
        >
          Generate calendar
        </button>
        <button className="btn" disabled={running} onClick={() => run({ dryRun: true })}>
          Dry run (free — preview the prompt)
        </button>
      </div>
      {log !== null && <pre className="log">{log}</pre>}
    </>
  );
}
