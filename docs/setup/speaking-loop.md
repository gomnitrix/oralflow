# Setup Guide – Speaking Practice Loop

Reference feature docs live under `specs/001-speaking-practice/` (see `quickstart.md` for QA walkthroughs).

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Next.js App Router knowledge + Tailwind CSS familiarity

## 2. Environment Variables

Duplicate `.env.example` to `.env.local` and configure:

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Used by `src/services/ai/client.ts` for text/eval calls |
| `GEMINI_API_KEY` | Optional alternative AI provider |
| `REALTIME_PROVIDER` | `openai` or `gemini`; powers Zen realtime |
| `LOCAL_STORAGE_PATH` | Filesystem location for repositories/storage adapter |

## 3. Install and Run

```sh
npm install
npm run dev
```

## 4. Required Verification

All contributors must run:

```sh
npm test && npm run lint
```

before opening a PR, matching the QA expectations documented in `quickstart.md`.
