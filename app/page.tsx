"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import PostCard from "@/components/PostCard";
import type { CalendarDoc, PostedMap, StateResponse } from "@/types/calendar";

export default function TodayPage() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [cal, setCal] = useState<CalendarDoc | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [posted, setPosted] = useState<PostedMap>({});

  useEffect(() => {
    (async () => {
      const s = await api<StateResponse>("/api/state");
      setState(s);
      setPosted(await api<PostedMap>("/api/posted"));
      try {
        setCal(await api<CalendarDoc>(`/api/calendar/${s.today.slice(0, 7)}`));
      } catch {
        setNotFound(true);
      }
    })();
  }, []);

  if (!state) return null;

  if (notFound) {
    const month = state.today.slice(0, 7);
    return (
      <>
        <h2>Today&apos;s call sheet</h2>
        <p className="sub">Copy, post at the listed time, tick it off.</p>
        <div className="empty">
          No calendar for {month} yet.
          <br />
          <Link className="btn primary" href="/generate">
            Generate it
          </Link>
        </div>
      </>
    );
  }

  if (!cal) return null;

  const showOfferBanner =
    cal.offer_needed_by && new Date(cal.offer_needed_by) >= new Date(state.today);

  const todays = (cal.weeks || [])
    .flatMap((w) => w.posts || [])
    .filter((p) => p.date === state.today)
    .sort((a, b) => (a.posting_time || "").localeCompare(b.posting_time || ""));

  return (
    <>
      <h2>Today&apos;s call sheet</h2>
      <p className="sub">Copy, post at the listed time, tick it off.</p>
      {showOfferBanner && (
        <div className="banner offer">
          ⭐ Close Week offer still undecided — set it in Settings by {cal.offer_needed_by}, then
          regenerate or hand-edit Week 4.
        </div>
      )}
      {todays.length === 0 ? (
        <div className="empty">Nothing scheduled today. Enjoy the quiet — or check the Calendar tab.</div>
      ) : (
        <div className="sheet">
          {todays.map((p) => (
            <PostCard
              key={`${p.date}|${p.channel}`}
              post={p}
              withTime
              initialDone={Boolean(posted[`${p.date}|${p.channel}`])}
            />
          ))}
        </div>
      )}
    </>
  );
}
