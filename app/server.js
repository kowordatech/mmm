#!/usr/bin/env node
/**
 * leads2conv Marketing Agent — Control Panel (minimal web app)
 *
 * Run:  npm install   (once, installs express)
 *       $env:ANTHROPIC_API_KEY = "sk-ant-..."   (PowerShell; needed for Generate button)
 *       npm start
 * Open: http://localhost:3210
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..");
const CALENDARS_DIR = path.join(ROOT, "calendars");
const CONFIG_PATH = path.join(ROOT, "config.json");
const POSTED_PATH = path.join(ROOT, "posted.json");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const readJson = (p, fallback) => {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
};
const writeJson = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2));

// ---- state ----
app.get("/api/state", (_req, res) => {
  const months = fs.existsSync(CALENDARS_DIR)
    ? fs.readdirSync(CALENDARS_DIR)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace("leads2conv-", "").replace(".json", ""))
        .sort()
        .reverse()
    : [];
  res.json({
    config: readJson(CONFIG_PATH, {}),
    months,
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
    today: new Date().toISOString().slice(0, 10)
  });
});

// ---- calendars ----
app.get("/api/calendar/:month", (req, res) => {
  const p = path.join(CALENDARS_DIR, `leads2conv-${req.params.month}.json`);
  if (!fs.existsSync(p)) return res.status(404).json({ error: "No calendar for that month yet. Generate one first." });
  res.json(readJson(p, {}));
});

// ---- posted tracker ----
app.get("/api/posted", (_req, res) => res.json(readJson(POSTED_PATH, {})));
app.post("/api/posted", (req, res) => {
  const { key, done } = req.body; // key = "YYYY-MM-DD|channel"
  const posted = readJson(POSTED_PATH, {});
  if (done) posted[key] = new Date().toISOString();
  else delete posted[key];
  writeJson(POSTED_PATH, posted);
  res.json({ ok: true });
});

// ---- config ----
app.post("/api/config", (req, res) => {
  const current = readJson(CONFIG_PATH, {});
  const allowed = ["whatsappNumber", "offer", "context", "extra"];
  for (const k of allowed) if (k in req.body) current[k] = req.body[k];
  writeJson(CONFIG_PATH, current);
  res.json({ ok: true, config: current });
});

// ---- generate (spawns the same script the GitHub Action uses) ----
let running = false;
app.post("/api/generate", (req, res) => {
  if (running) return res.status(409).json({ error: "A generation is already running." });
  if (!process.env.ANTHROPIC_API_KEY && !req.body.dryRun) {
    return res.status(400).json({ error: "ANTHROPIC_API_KEY is not set in the terminal that started this server." });
  }
  running = true;
  const args = [path.join(ROOT, "scripts", "generate.js")];
  if (req.body.dryRun) args.push("--dry-run");
  else if (req.body.month) args.push("--month", req.body.month);
  else if (req.body.thisMonth) args.push("--this-month");

  const child = spawn(process.execPath, args, { env: process.env });
  let log = "";
  child.stdout.on("data", (d) => (log += d.toString()));
  child.stderr.on("data", (d) => (log += d.toString()));
  child.on("close", (code) => {
    running = false;
    res.json({ ok: code === 0, code, log });
  });
});

const PORT = process.env.PORT || 3210;
app.listen(PORT, () => {
  console.log(`leads2conv control panel → http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("Note: ANTHROPIC_API_KEY not set — the Generate button will only allow dry runs.");
  }
});
