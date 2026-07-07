import { NextResponse } from "next/server";
import { POSTED_PATH } from "@/lib/paths";
import { readJson, writeJson } from "@/lib/fsJson";
import type { PostedMap } from "@/types/calendar";

export async function GET() {
  return NextResponse.json(readJson<PostedMap>(POSTED_PATH, {}));
}

export async function POST(request: Request) {
  const { key, done } = (await request.json()) as { key: string; done: boolean };
  const posted = readJson<PostedMap>(POSTED_PATH, {});
  if (done) posted[key] = new Date().toISOString();
  else delete posted[key];
  writeJson(POSTED_PATH, posted);
  return NextResponse.json({ ok: true });
}
