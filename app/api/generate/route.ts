import path from "path";
import { spawn } from "child_process";
import { NextResponse } from "next/server";
import { ROOT } from "@/lib/paths";

let running = false;

interface GenerateBody {
  dryRun?: boolean;
  month?: string;
  thisMonth?: boolean;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateBody;

  if (running) {
    return NextResponse.json({ error: "A generation is already running." }, { status: 409 });
  }
  if (!process.env.ANTHROPIC_API_KEY && !body.dryRun) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in the environment running this server." },
      { status: 400 }
    );
  }

  running = true;
  const args = [path.join(ROOT, "scripts", "generate.js")];
  if (body.dryRun) args.push("--dry-run");
  else if (body.month) args.push("--month", body.month);
  else if (body.thisMonth) args.push("--this-month");

  const result = await new Promise<{ ok: boolean; code: number | null; log: string }>((resolve) => {
    const child = spawn(process.execPath, args, { env: process.env });
    let log = "";
    child.stdout.on("data", (d) => (log += d.toString()));
    child.stderr.on("data", (d) => (log += d.toString()));
    child.on("close", (code) => resolve({ ok: code === 0, code, log }));
  });
  running = false;

  return NextResponse.json(result);
}
