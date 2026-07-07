# leads2conv Marketing Agent — Implementation Guide

Automated monthly content calendar generator **with a local web control panel**. GitHub Actions (free tier) generates the calendar with two Anthropic API calls a month (generate + QA); the web app is your daily desk: today's posts with copy buttons, month view, generate trigger, and settings.

```
leads2conv-marketing-agent/
├── .github/workflows/generate-calendar.yml   # monthly cron + manual trigger
├── app/                     # Next.js control panel (App Router, TypeScript)
│   ├── layout.tsx           # header, nav, toast provider
│   ├── globals.css          # the UI's styling
│   ├── page.tsx             # Today tab ("/")
│   ├── calendar/page.tsx    # Calendar tab
│   ├── generate/page.tsx    # Generate tab
│   ├── settings/page.tsx    # Settings tab
│   └── api/                 # route handlers (state, calendar, posted, config, generate)
├── components/              # PostCard, NavTabs, DateChip
├── lib/                     # fs/JSON helpers, fetch wrapper, toast context
├── types/calendar.ts        # shared types
├── prompts/
│   ├── system.txt          # the agent's brain (voice, arc, rules, schema)
│   ├── task.template.txt   # monthly trigger, {{variables}} filled by the script
│   └── qa.txt              # reviewer pass
├── scripts/generate.js     # generation engine (used by both CLI and the web app's Generate tab)
├── calendars/              # output: leads2conv-YYYY-MM.json
├── hooks-history.json      # memory of past hooks (prevents repetition)
├── posted.json             # created by the app: what you've ticked as posted
├── config.json             # offer, WhatsApp number, extras (editable in the app)
└── package.json
```

## QUICK START — the web app (10 min)

```powershell
npm install                                   # installs Next.js/React + dotenv (once)
copy .env.example .env                        # then edit .env and paste your key
npm run dev
```

Open **http://localhost:3210**. Four tabs (each its own route: `/`, `/calendar`, `/generate`, `/settings`):

- **Today** — a call sheet of today's posts sorted by posting time. Copy post (or post + hashtags) with one click, tick "Posted" when done. Shows a banner if the Close Week offer is still TBD and the decide-by date is approaching.
- **Calendar** — every post for any generated month, grouped by week with themes.
- **Generate** — buttons for "Next month" / "This month", plus a free **Dry run** that previews the exact prompt without an API call. Logs appear in the page.
- **Settings** — edits config.json (offer, WhatsApp number, seasonal context, extra instructions) right from the browser.

The Generate button needs the API key set in the terminal *before* `npm start`. Without it, dry runs still work.

---

## STEP 1 — Get the project onto your machine (5 min)

1. Unzip this folder (or copy the files into a new directory).
2. Confirm Node 18+ is installed: `node --version`
3. From the project folder, run the dry run (no API key needed):

```bash
npm run dry-run
```

You should see the exact prompt that would be sent, with next month's dates and an auto-selected seasonal hook. If you see that, the plumbing works.

## STEP 2 — Set your config (2 min)

Open `config.json` and edit:

- `whatsappNumber` — your real business WhatsApp number (goes into CTAs).
- `offer` — this month's Close Week offer, e.g. `"free setup + we migrate your existing leads"`. Leave as `"TBD"` if undecided; the agent will write placeholder posts and the workflow will open a GitHub issue reminding you to decide before Week 4.
- `context` — leave as `"auto"` (the script picks a Ghana-business seasonal hook per month) or override with your own, e.g. `"we just launched leaderboards v2"`.
- `extra` — anything special this month: a testimonial you got, a feature launch, `"none"` otherwise.

## STEP 3 — First local generation (5 min, ~2 API calls)

1. Get an API key from console.anthropic.com → API Keys.
2. Copy `.env.example` to `.env` and paste your key into `ANTHROPIC_API_KEY=`.
3. Run:

```bash
npm run generate:this-month
```

3. Check the output: `calendars/leads2conv-2026-07.json` (or current month). Open it — every post has `date`, `channel`, `posting_time`, full `body`, `cta`, `hashtags`, and a `graphic_brief`.
4. Also check `hooks-history.json` — it now contains this month's hooks. Next month's run automatically avoids repeating them.

Read the first generated calendar fully. If the voice is off anywhere, fix it at the source: edit `prompts/system.txt` (e.g., add banned phrases to the NEVER list, or add a great post of yours as a style example). The prompts are the product — tune them once and every future month inherits it.

## STEP 4 — Push to GitHub (5 min)

```bash
git init
git add .
git commit -m "leads2conv marketing agent v1"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leads2conv-marketing-agent.git
git push -u origin main
```

Use a **private** repo — your calendars and offers are competitive info.

## STEP 5 — Add the API key as a secret (2 min)

On GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**

- Name: `ANTHROPIC_API_KEY`
- Value: your key

Never put the key in code or config.json.

## STEP 6 — Test the workflow manually (3 min)

1. Repo → **Actions** tab → "Generate leads2conv monthly calendar" → **Run workflow**.
2. Optionally set `month` (e.g. `2026-08`) or tick `this_month`.
3. Watch the run. On success it commits `calendars/leads2conv-YYYY-MM.json` + updated `hooks-history.json` back to the repo, and opens a reminder issue if your offer was TBD.

From now on it runs itself: **every 25th at 06:00 UTC it generates next month's calendar** so it's waiting for you before the 1st.

## STEP 7 — Wire into your control panel (optional, 15–30 min)

Your existing Express app (from the MyTradeNest system) just needs to read the JSON. Two options:

**A. Same-repo simplicity:** clone/pull this repo on the machine running the panel and read the file:

```javascript
const cal = JSON.parse(fs.readFileSync(`calendars/leads2conv-${month}.json`));
const today = new Date().toISOString().slice(0, 10);
const todaysPosts = cal.weeks.flatMap(w => w.posts).filter(p => p.date === today);
```

**B. Fetch from GitHub raw** (private repo → use a fine-grained PAT with read-only contents permission):

```javascript
const res = await fetch(
  `https://raw.githubusercontent.com/YOU/leads2conv-marketing-agent/main/calendars/leads2conv-${month}.json`,
  { headers: { Authorization: `Bearer ${process.env.GH_PAT}` } }
);
```

Panel features worth adding (each ~30 min): a "Today's posts" view with copy buttons per channel; a posted/not-posted checkbox saved to a local JSON; the `graphic_brief` shown next to each graphic post.

## STEP 8 — Your monthly routine (the human 20%)

1. **~25th**: calendar auto-generates. You get a GitHub issue if the offer is TBD.
2. **Before the 1st**: read the calendar once (10 min). Edit any post you want directly in the JSON — it's your copy, the agent just drafts.
3. **Set the offer**: update `config.json` → `offer`, then re-run the workflow with `month=YYYY-MM` to regenerate Week 4 with the real offer (or hand-edit the ⭐[OFFER] placeholders — faster).
4. **Daily (5 min)**: open today's posts, post them at the listed times, make the graphic from the brief.
5. **Month-end**: put your results into `config.json` → `extra`, e.g. `"Last month: 34 DMs, 9 demos, 3 sign-ups. ROI-math posts converted best."` The agent biases next month toward what worked.

## Troubleshooting

- **`API error 401`** — key wrong/missing. Check the secret name is exactly `ANTHROPIC_API_KEY`.
- **`No JSON object found`** — rare; the model added commentary. Just re-run; the extractor already strips fences and preambles.
- **Workflow can't push** — repo → Settings → Actions → General → Workflow permissions → "Read and write permissions".
- **Posts feel repetitive after a few months** — raise `hooksHistoryMonths` in config.json to 3–4.

## Cost

2 API calls/month (~10–15k tokens total) on Sonnet — a few US cents. GitHub Actions free tier covers a monthly 1-minute job hundreds of times over.

## Later extensions

- **Daily variant agent**: small cron that turns today's post into an X thread + Twi-flavored Facebook variant (1 cheap call/day).
- **Auto-graphics**: pipe `graphic_brief` into an image workflow to produce your quote cards (1080×1080 FB/IG, quarter-A4 WhatsApp PNG).
- **Auto-posting**: WhatsApp Business API / Meta Graph API can post automatically, but manual posting keeps you compliant and lets you reply to DMs instantly — which is where the sales actually happen.
#   m m m  
 