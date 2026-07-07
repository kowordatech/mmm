import fs from "fs";
import { NextResponse } from "next/server";
import { CALENDARS_DIR, CONFIG_PATH } from "@/lib/paths";
import { readJson } from "@/lib/fsJson";
import type { Config, StateResponse } from "@/types/calendar";

export async function GET() {
  const months = fs.existsSync(CALENDARS_DIR)
    ? fs
        .readdirSync(CALENDARS_DIR)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace("leads2conv-", "").replace(".json", ""))
        .sort()
        .reverse()
    : [];

  const body: StateResponse = {
    config: readJson<Config>(CONFIG_PATH, {}),
    months,
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
    today: new Date().toISOString().slice(0, 10),
  };

  return NextResponse.json(body);
}
