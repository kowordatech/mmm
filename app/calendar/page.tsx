"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PostCard from "@/components/PostCard";
import type { CalendarDoc, PostedMap, StateResponse } from "@/types/calendar";

export default function CalendarPage() {
  const [months, setMonths] = useState<string[] | null>(null);
  const [month, setMonth] = useState("");
  const [cal, setCal] = useState<CalendarDoc | null>(null);
  const [posted, setPosted] = useState<PostedMap>({});

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        api<StateResponse>("/api/state"),
        api<PostedMap>("/api/posted"),
      ]);
      setMonths(s.months);
      setPosted(p);
      if (s.months.length) setMonth(s.months[0]);
    })();
  }, []);

  useEffect(() => {
    if (!month) return;
    api<CalendarDoc>(`/api/calendar/${month}`).then(setCal);
  }, [month]);

  return (
    <>
      <h2>Month view</h2>
      <p className="sub">Every post for the month, grouped by week.</p>
      {months === null ? null : months.length === 0 ? (
        <div className="empty">No calendars generated yet.</div>
      ) : (
        <>
          <select
            style={{ maxWidth: 220, marginBottom: 10 }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {cal && (
            <div>
              {cal.theme && (
                <p className="sub" style={{ marginTop: 8 }}>
                  &ldquo;{cal.theme}&rdquo;
                </p>
              )}
              {(cal.weeks || []).map((w) => (
                <div key={w.week_number}>
                  <div className="week-h">
                    Week {w.week_number} — {w.theme || ""}
                  </div>
                  {(w.posts || []).map((p) => (
                    <PostCard
                      key={`${p.date}|${p.channel}`}
                      post={p}
                      withTime={false}
                      initialDone={Boolean(posted[`${p.date}|${p.channel}`])}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
