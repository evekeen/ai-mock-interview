Step‑by‑step implementation plan
1 ▪ Project bootstrap

    npx create-next-app@latest interview‑coach --typescript --tailwind

    Enable App Router (app/), ESLint, Prettier, Husky pre‑commit.

    Push to GitHub → import into Vercel (automatic CI/CD).

2 ▪ Core config
Area	Choice	Notes
UI lib	Tailwind CSS	already set; add shadcn/ui for cards, dialog, tabs.
State	Zustand	minimal, TS‑friendly.
Auth	Clerk (email / OAuth)	free tier sufficient, good hooks.
DB	Supabase Postgres	row‑level security + edge‑ready client.
File storage	Supabase Storage	resumes, JD PDFs, audio blobs.
3 ▪ Data model (Postgres)

users(id, clerk_id, personality_type)
uploads(id, user_id, type enum('resume','jd'), url, parsed_json)
stories(id, user_id, category, title, bullet_points, score)
practice_runs(id, user_id, story_id, audio_url, wpm, filler_rate, sentiment, created_at)

4 ▪ Top‑level routes (app router)

/ (dashboard – progress heatmap)
/onboarding (wizard – personality & goals)
/upload (dropzone for resume & JD)
/brainstorm (big prompt + free‑write)
/chat (AI assistant refine flow)
/stories (grid of 4 core challenge types)
/mock (audio mock interview)
/feedback/[runId] (analysis & word‑cloud)

5 ▪ Resume + JD pipeline

    Frontend dropzone → /api/parse-upload (edge function).

    Store raw file → Supabase Storage.

    Extract text with pdf-parse (resume) or @langchain/community/document-loaders plus OpenAI text-embedding → store JSON (parsed_json).

    Surface extracted sections in onboarding step for user review.

### 6 ▪ Onboarding wizard

    3 pages: personality quiz → experience level → goals.

    Persist to users table; skip allowed.

    Use shadcn Stepper component.

### 7 ▪ Free‑write screen

    Full‑screen <TextareaAutosize> bound to Zustand.

    Autosave draft every 5 s to localStorage.

    “Finish” → chunk text → /api/gist to tag key moments via OpenAI function‑calling; save as provisional stories.

### 8 ▪ Interactive refinement chatbot

    UI: 2‑column – chat stream / sidebar showing extracted bullet list.

    Serverless /api/chat → OpenAI gpt‑4o with system prompt requesting STAR format, quantification, impact metrics.

    Responses update specific stories rows.

### 9 ▪ Story bank & progress tracker

    Grid (4 challenge categories × status) colored by score.

    Each card opens modal to edit story; strength score recalculated by /api/score-story (LLM + simple rubric).

### 10 ▪ Mock interview module

    Pre‑select stories still weak → ask those first.

    Use react-media-recorder to capture mic.

    Show static interviewer avatar (Next.js Image).

    After each answer, POST audio blob to /api/analyze-audio.

        Edge‑function proxies to Deepgram or Whisper for transcription.

        Run filler‑word & pacing analysis (simple JS regex, WPM calc).

    Save practice_runs row.

### 11 ▪ Feedback & score page

    Fetch run data + transcript.

    Render wordcloud (react-wordcloud) from nouns/verbs.

    Display metrics: WPM, filler %, positivity (sentiment.js).

    Inline suggestions returned by LLM (improvement_points).

### 12 ▪ Edge vs server functions

    Fast chat & scoring → Vercel Edge Functions (latency).

    Heavier audio analysis → Serverless Functions (14 MB limit OK).

    Split accordingly in /api/.

### 13 ▪ Environment & secrets

    OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEEPGRAM_KEY.

    Add via Vercel project settings, mark as encrypted.

### 14 ▪ Testing

    Cypress e2e for onboarding, upload, chat flow.

    Jest + React Testing Library for components.

    Playwright trace on Vercel Preview to ensure edge functions work.

### 15 ▪ Analytics & observability

    Vercel Web Analytics (page flow).

    Sentry Next.js SDK for FE/BE errors.

    Logflare add‑on for function logs.

### 16 ▪ Rollout phases
Week	Milestone
1	Repo, auth, DB schema, upload parse API
2	Onboarding UI, free‑write, chat MVP
3	Story bank, scoring, dashboard
4	Mock interview record & analysis
5	Feedback visuals, polish, mobile UX
6	Beta launch → collect user telemetry & refine rubric