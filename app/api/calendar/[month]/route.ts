import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { CALENDARS_DIR } from "@/lib/paths";
import { readJson } from "@/lib/fsJson";
import type { CalendarDoc } from "@/types/calendar";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> }
) {
  const { month } = await params;
  const p = path.join(CALENDARS_DIR, `leads2conv-${month}.json`);
  if (!fs.existsSync(p)) {
    return NextResponse.json(
      { error: "No calendar for that month yet. Generate one first." },
      { status: 404 }
    );
  }
  return NextResponse.json(readJson<CalendarDoc>(p, { weeks: [] }));
}
