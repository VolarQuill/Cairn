# Cairn — your AI learning companion

Turn any source — an article, a document, a link, or just a topic — into a
structured, adaptive course. Cairn generates lessons, re-explains concepts in
five different styles, quizzes you (and explains every answer), answers questions
about *your* material with a retrieval-grounded tutor, and schedules spaced
reviews so what you learn actually sticks.

A real product, not a prototype —
and it ships in two forms:

| Copy | Runs on | Data | Auth |
|------|---------|------|------|
| **Cloud** | Vercel | Supabase (Postgres) | Supabase Auth |
| **Local** | Your machine / Docker | JSON file | Signed-cookie + scrypt |

The same application code runs both ways — the backend is selected by a single
environment variable, `DATA_BACKEND`.

## Features

- **AI course builder** — paste text, upload a file, drop a URL, or name a topic. Cairn structures it into modules and lessons with objectives, key terms, and time estimates.
- **Five explanation styles** — re-explain any concept *simply*, *in depth*, *by analogy*, *visually*, or *with a worked example*.
- **Adaptive quizzes** — auto-generated multiple-choice / true-false questions, graded instantly, with an explanation for every option.
- **Study chat (RAG)** — ask anything about your course; a built-in TF-IDF retriever grounds answers in your own lessons.
- **Spaced repetition** — an SM-2-inspired scheduler tracks mastery (new → learning → familiar → mastered) and tells you what's due.
- **Works offline** — no API key? Cairn falls back to built-in generation so the whole product still runs end-to-end. Add a key to unlock full AI quality.
- **Warm, readable design** — forest greens, amber, and terracotta on cream, set in Times New Roman. No cold blues, no purple gradients.

## Quick start (local, 60 seconds)

No database, no API key required.

```bash
npm install
cp .env.example .env.local     # optional — defaults already work
npm run seed                   # creates a demo account + 2 sample courses
npm run dev                    # http://localhost:3000
```

Sign in with the seeded account, or create your own:

```
email:    demo@cairn.local
password: demo123
```

> **Tip:** add a model provider key to `.env.local` to upgrade from the offline
> fallback to full AI-authored courses. Cairn is provider-agnostic: set
> `GEMINI_API_KEY` (recommended) or `ANTHROPIC_API_KEY`. You can also point
> `GEMINI_BASE_URL` / `ANTHROPIC_BASE_URL` at any OpenAI-compatible gateway and
> set `CAIRN_MODEL` to choose the model.

### Run it in Docker instead

```bash
docker compose up --build      # http://localhost:3000
```

Your data persists in the `cairn-data` volume.

## Deploy to Vercel + Supabase

### 1. Create the database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates all tables, a profile-on-signup trigger, and row-level security.
3. From **Project Settings → API**, copy your URL, `anon` key, and `service_role` key.

### 2. Deploy the app

1. Push this repo to GitHub and **Import** it into Vercel (framework auto-detects as Next.js).
2. Add these environment variables in Vercel:

   ```
   DATA_BACKEND=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
   GEMINI_API_KEY=YOUR-GEMINI-KEY           # recommended
   ANTHROPIC_API_KEY=YOUR-ANTHROPIC-KEY     # optional
   CAIRN_MODEL=gemini-1.5-flash             # optional
   CAIRN_SECRET=long-random-string          # required in prod
   ```

3. Deploy. Sign-ups now flow through Supabase Auth. (If you leave email
   confirmation on in Supabase, users confirm via email before first sign-in.)

## How it works

```
        Source (text / url / file / topic)
                     │
              ┌──────▼───────┐
              │  lib/ai      │  Gemini / Claude (or offline fallback)
              │  prompts     │  → structured course JSON
              └──────┬───────┘
                     │
          ┌──────────▼──────────┐        ┌──────────────────────┐
          │   lib/db (interface)│───────▶│ local: JSON file      │
          │  backend-agnostic   │        │ supabase: Postgres    │
          └──────────┬──────────┘        └──────────────────────┘
                     │
   learn · explain · quiz · chat (RAG) · spaced review
```

- **`lib/db`** defines one `Database` interface with two implementations
  (`local.ts`, `supabase.ts`). Everything else is backend-agnostic.
- **`lib/auth`** provides one auth facade over local sessions and Supabase Auth.
- **`lib/ai`** wraps the model, prompts, a pure-JS TF-IDF retriever, and offline
  fallbacks. **`lib/srs.ts`** is the spaced-repetition scheduler.

## Project structure

```
app/
  (app)/            authenticated pages: dashboard, library, create, course, settings
  api/              route handlers: auth, courses, quiz, chat, progress, me
  page.tsx          marketing landing page
components/         UI: AppShell, CourseCard, LessonReader, QuizRunner, ChatPanel…
lib/
  ai/               provider, prompts, retriever (RAG)
  db/               interface + local & supabase backends
  auth/             unified auth facade
  srs.ts            spaced-repetition scheduler
  types.ts          shared domain types
scripts/
  seed.mjs          seed local demo data
  make_demo.py      generate the demo video
supabase/schema.sql cloud schema + RLS
```

## Configuration reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATA_BACKEND` | `local` | `local` (JSON file) or `supabase` |
| `GEMINI_API_KEY` | — | Enables Gemini generation (recommended) |
| `GEMINI_BASE_URL` | Google OpenAI-compatible endpoint | Override Gemini gateway |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model id |
| `ANTHROPIC_API_KEY` | — | Enables Anthropic Claude generation |
| `ANTHROPIC_BASE_URL` | — | OpenAI-compatible gateway (optional) |
| `CAIRN_MODEL` | provider default | Model id (overrides provider default) |
| `CAIRN_SECRET` | dev default | Signs local session cookies (**change in prod**) |
| `CAIRN_DATA_DIR` | `./data` | Where the local JSON store lives |
| `NEXT_PUBLIC_SUPABASE_URL` | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Supabase service-role key |

## Demo video

A walkthrough is generated programmatically:

```bash
pip install pillow imageio-ffmpeg
npm run demo         # writes cairn-demo.mp4
```

## License

MIT — free to use, learn from, and build on.
