import { NextResponse } from "next/server";
import { RESULTS_PATH } from "@/lib/paths";
import { readJson, writeJson } from "@/lib/fsJson";
import type { MonthlyResult, ResultsMap } from "@/types/calendar";

export async function GET() {
  return NextResponse.json(readJson<ResultsMap>(RESULTS_PATH, {}));
}

export async function POST(request: Request) {
  const body = (await request.json()) as { month: string } & MonthlyResult;
  const { month, dms, demos, signups, revenue, notes } = body;
  if (!month) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }
  const results = readJson<ResultsMap>(RESULTS_PATH, {});
  results[month] = { dms, demos, signups, revenue, notes };
  writeJson(RESULTS_PATH, results);
  return NextResponse.json({ ok: true, results: results[month] });
}
