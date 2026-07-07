import { NextResponse } from "next/server";
import { CONFIG_PATH } from "@/lib/paths";
import { readJson, writeJson } from "@/lib/fsJson";
import type { Config } from "@/types/calendar";

const ALLOWED = ["whatsappNumber", "offer", "context", "extra"] as const;
type AllowedKey = (typeof ALLOWED)[number];

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Record<AllowedKey, string>>;
  const current = readJson<Config>(CONFIG_PATH, {});
  for (const k of ALLOWED) {
    if (body[k] !== undefined) current[k] = body[k];
  }
  writeJson(CONFIG_PATH, current);
  return NextResponse.json({ ok: true, config: current });
}
