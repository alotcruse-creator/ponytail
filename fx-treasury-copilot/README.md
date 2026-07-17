# FX Treasury Copilot — Phase 1

Morning FX **market intelligence** for a money-transfer treasury desk, PHP-first.
Read-only: the system **never executes or recommends trades**. Every number is
computed deterministically; AI only rewrites those facts into prose.

## What Phase 1 gives you

Open it at 8 AM and in under two minutes see, in one place:

- **Dashboard** — today's currency sentiment, high-impact events, PHP focus,
  top headlines, and an AI morning brief.
- **Market News** — deduped, importance-ranked, with affected currency,
  sentiment, and confidence.
- **Economic Calendar** — events with forecast/previous/impact + AI top-events.
- **PHP Monitor** — PHP sentiment, drivers, headlines, and AI commentary.

## Run it

```bash
# backend  (http://localhost:8000)
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# frontend (http://localhost:3000)
cd frontend && npm install && npm run dev
```

`GET /docs` on the backend lists every endpoint. Data seeds itself on first run.

## Deploy (free, view it on your phone)

Two free services; open the Vercel URL on your phone and bookmark it.

**Backend → Render** (blueprint included):
1. Push this repo to GitHub (done if you're reading this there).
2. Render → **New > Blueprint** → pick this repo. It reads `render.yaml` and
   creates the backend. (Optional: add `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`
   in the service's Environment tab.)
3. Copy the service URL, e.g. `https://fx-copilot-backend.onrender.com`.

**Frontend → Vercel**:
1. Vercel → **Add New > Project** → import this repo.
2. Set **Root Directory** to `fx-treasury-copilot/frontend`.
3. Add env var `NEXT_PUBLIC_API_URL` = your Render URL from above. Deploy.

Open the Vercel URL on your phone. Render's free backend sleeps after ~15 min
idle, so the first load each morning cold-starts (~30–50s); later loads are
instant.

## AI (optional, dual-provider)

Set either `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (or both) to get live
morning-brief / end-of-day / commentary text. Providers are tried in order —
Anthropic, then OpenAI — so if one key is missing or its API is down, the other
serves the request. Models default to `claude-haiku-4-5-20251001` and
`gpt-4o-mini` (override with `ANTHROPIC_MODEL` / `OPENAI_MODEL`). With no key at
all, the app returns deterministic rule-based summaries — nothing breaks.

## Deliberately deferred (Phase 1 laziness, on purpose)

| Skipped now | Why | Add when |
|---|---|---|
| Live Reuters/Bloomberg/BSP/Fed feeds | paid / unshaped; `seed.py` is the single swap point | a real feed is contracted |
| PostgreSQL server | SQLite runs with zero setup | deploying — set `DATABASE_URL` to a Postgres DSN, no code change |
| JWT auth | single-trader MVP | multi-user / deployed |
| Docker | `uvicorn` + `next dev` is enough locally | packaging for deploy |
| Exposure Monitor / Liquidity / Chat | Phase 2–4 | those phases; PHP exposure figures shown now are illustrative placeholders |

## Endpoints

`/news` · `/calendar` · `/php` · `/market-summary` · `/morning-brief` ·
`/end-of-day` · `/health`

## Tests

```bash
cd backend && python -m app.intel   # dedup / ranking / AI-fallback self-check
```
