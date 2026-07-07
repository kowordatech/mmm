#!/usr/bin/env node
/**
 * leads2conv Marketing Agent — monthly calendar generator
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate.js            # generates NEXT month
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate.js --this-month
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate.js --month 2026-08
 *   node scripts/generate.js --dry-run                           # no API call, prints the prompt
 *
 * Outputs:
 *   calendars/leads2conv-YYYY-MM.json   (final, QA-passed calendar)
 *   hooks-history.json                  (updated hook memory)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));
const SYSTEM_PROMPT = fs.readFileSync(path.join(ROOT, "prompts", "system.txt"), "utf8");
const TASK_TEMPLATE = fs.readFileSync(path.join(ROOT, "prompts", "task.template.txt"), "utf8");
const QA_PROMPT = fs.readFileSync(path.join(ROOT, "prompts", "qa.txt"), "utf8");
const HOOKS_PATH = path.join(ROOT, "hooks-history.json");
const CALENDARS_DIR = path.join(ROOT, "calendars");

const API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = process.env.ANTHROPIC_API_KEY;

// ---------- helpers ----------

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dryRun: args.includes("--dry-run"), thisMonth: args.includes("--this-month"), month: null };
  const mIdx = args.indexOf("--month");
  if (mIdx !== -1 && args[mIdx + 1]) out.month = args[mIdx + 1]; // "YYYY-MM"
  return out;
}

function targetMonth(opts) {
  const now = new Date();
  if (opts.month) {
    const [y, m] = opts.month.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1));
  }
  const shift = opts.thisMonth ? 0 : 1; // default: generate NEXT month
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + shift, 1));
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function seasonalContext(monthIndex) {
  // 0 = Jan. Auto seasonal hooks for Ghana business calendar.
  const map = {
    0: "New year — sales planning season, teams setting annual targets",
    1: "Q1 execution — early-year momentum, Valentine retail bump",
    2: "End of Q1 approaching — first quarterly review",
    3: "Q2 starts — Easter season, post-review adjustments",
    4: "Mid-Q2 push — May Day, mid-quarter accountability",
    5: "H1 closing — half-year results due",
    6: "Mid-year push — H1 just ended, 'winners adjust in July not January'",
    7: "H2 execution — back-to-school spending season",
    8: "Q3 closing — last full quarter before year-end sprint",
    9: "Q4 starts — year-end sales sprint begins",
    10: "November — race to annual targets, pre-December positioning",
    11: "December — festive sales peak, plan January in December"
  };
  return map[monthIndex];
}

function loadHooksHistory() {
  if (!fs.existsSync(HOOKS_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(HOOKS_PATH, "utf8")); } catch { return {}; }
}

function recentHooks(history, months) {
  const keys = Object.keys(history).sort().slice(-months);
  return keys.flatMap((k) => history[k]);
}

function extractJson(text) {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  // tolerate any stray preamble by finding the first { ... last }
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in model response");
  return JSON.parse(clean.slice(start, end + 1));
}

async function callClaude(system, userContent) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      system,
      messages: [{ role: "user", content: userContent }]
    })
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API error ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

function validateCalendar(cal) {
  const problems = [];
  if (!cal.month || !Array.isArray(cal.weeks)) problems.push("missing month/weeks");
  const channels = new Set(["linkedin", "facebook", "whatsapp_status", "whatsapp_broadcast"]);
  for (const w of cal.weeks || []) {
    for (const p of w.posts || []) {
      if (!p.date || !p.body) problems.push(`post missing date/body in week ${w.week_number}`);
      if (!channels.has(p.channel)) problems.push(`unknown channel "${p.channel}" on ${p.date}`);
    }
  }
  return problems;
}

// ---------- main ----------

(async () => {
  const opts = parseArgs();
  const first = targetMonth(opts);
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  const monthKey = fmt(first).slice(0, 7); // YYYY-MM
  const monthName = first.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });

  const history = loadHooksHistory();
  const prevHooks = recentHooks(history, CONFIG.hooksHistoryMonths);
  const context = CONFIG.context === "auto" ? seasonalContext(first.getUTCMonth()) : CONFIG.context;

  const taskPrompt = TASK_TEMPLATE
    .replaceAll("{{MONTH_NAME}}", monthName)
    .replaceAll("{{YEAR}}", String(first.getUTCFullYear()))
    .replaceAll("{{START_DATE}}", fmt(first))
    .replaceAll("{{END_DATE}}", fmt(last))
    .replaceAll("{{CONTEXT}}", context)
    .replaceAll("{{OFFER}}", CONFIG.offer)
    .replaceAll("{{WHATSAPP_NUMBER}}", CONFIG.whatsappNumber)
    .replaceAll("{{PREVIOUS_HOOKS_LIST}}", JSON.stringify(prevHooks))
    .replaceAll("{{EXTRA}}", CONFIG.extra);

  if (opts.dryRun) {
    console.log("=== DRY RUN — task prompt that would be sent ===\n");
    console.log(taskPrompt);
    process.exit(0);
  }

  if (!API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY is not set.");
    process.exit(1);
  }

  console.log(`[1/4] Generating calendar for ${monthName} ${first.getUTCFullYear()}...`);
  const rawText = await callClaude(SYSTEM_PROMPT, taskPrompt);
  let calendar = extractJson(rawText);

  console.log("[2/4] Running QA review pass...");
  const qaText = await callClaude(
    QA_PROMPT,
    `PREVIOUS_HOOKS_LIST: ${JSON.stringify(prevHooks)}\n\nCALENDAR JSON:\n${JSON.stringify(calendar)}`
  );
  try {
    calendar = extractJson(qaText);
  } catch (e) {
    console.warn("  QA pass returned unparseable output — keeping the original calendar.", e.message);
    calendar.qa_report = [{ issue: "QA pass failed to parse; original kept", fixed: false }];
  }

  const problems = validateCalendar(calendar);
  if (problems.length) {
    console.warn("  Schema warnings:", problems.join("; "));
  }

  console.log("[3/4] Saving outputs...");
  fs.mkdirSync(CALENDARS_DIR, { recursive: true });
  const outPath = path.join(CALENDARS_DIR, `leads2conv-${monthKey}.json`);
  fs.writeFileSync(outPath, JSON.stringify(calendar, null, 2));

  // update hook memory
  const hooks = (calendar.weeks || []).flatMap((w) => (w.posts || []).map((p) => p.hook)).filter(Boolean);
  history[monthKey] = hooks;
  fs.writeFileSync(HOOKS_PATH, JSON.stringify(history, null, 2));

  console.log(`[4/4] Done. Calendar: ${outPath}`);
  console.log(`  Posts generated: ${hooks.length}`);
  console.log(`  QA fixes: ${(calendar.qa_report || []).length}`);

  // surface the offer reminder for the GitHub Actions step
  if (calendar.offer_needed_by) {
    console.log(`OFFER_NEEDED_BY=${calendar.offer_needed_by}`);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `offer_needed_by=${calendar.offer_needed_by}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `month=${monthKey}\n`);
    }
  }
})().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
