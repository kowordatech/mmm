"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { Config, StateResponse } from "@/types/calendar";

export default function SettingsPage() {
  const [form, setForm] = useState<Config | null>(null);
  const toast = useToast();

  useEffect(() => {
    api<StateResponse>("/api/state").then((s) =>
      setForm({
        whatsappNumber: s.config.whatsappNumber || "",
        offer: s.config.offer || "",
        context: s.config.context || "auto",
        extra: s.config.extra || "",
      })
    );
  }, []);

  if (!form) return null;

  const set = (key: keyof Config) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const save = async () => {
    const r = await api<{ ok: boolean; config: Config }>("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(r.config);
    toast("Settings saved");
  };

  return (
    <>
      <h2>Settings</h2>
      <p className="sub">Saved to config.json — the next generation uses these values.</p>
      <div className="field">
        <label htmlFor="sWa">WhatsApp number (goes into CTAs)</label>
        <input id="sWa" value={form.whatsappNumber} onChange={set("whatsappNumber")} />
      </div>
      <div className="field">
        <label htmlFor="sOffer">This month&apos;s Close Week offer (&quot;TBD&quot; if undecided)</label>
        <input id="sOffer" value={form.offer} onChange={set("offer")} />
      </div>
      <div className="field">
        <label htmlFor="sCtx">Seasonal context (&quot;auto&quot; = picked for you per month)</label>
        <input id="sCtx" value={form.context} onChange={set("context")} />
      </div>
      <div className="field">
        <label htmlFor="sExtra">Extra instructions (testimonials, launches, last month&apos;s results)</label>
        <textarea id="sExtra" value={form.extra} onChange={set("extra")} />
      </div>
      <button className="btn primary" onClick={save}>
        Save settings
      </button>
    </>
  );
}
