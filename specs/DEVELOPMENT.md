# OralFlow Development Guide

**Last Updated**: 2026-01-24

---

## Task Verification Workflow

**Important**: This project uses a two-stage task completion process.

### Task Status Legend

| Symbol | Meaning | Who Can Set |
|--------|---------|-------------|
| `[x]` | **Completed** - Verified and accepted | Maintainer only |
| `[-]` | **Implemented** - Code done, pending verification | AI/Developer |
| `[~]` | **Partial** - Needs more work | AI/Developer |
| `[ ]` | **Not started** | - |

### Workflow Rules

1. **AI/Developers**: When you complete a task:
   - **First**, ensure `npm run build && npm test && npm run lint` all pass
   - **Then**, mark it as `[-]` (implemented, pending verification), NOT `[x]`
   - **Finally**, automatically **commit and push** the changes. Use conventional commit format (e.g., `feat: add profile page`) and keep messages concise.

2. **Maintainer**: After manual testing and verification, the maintainer will update `[-]` to `[x]`.

3. **Never** mark a task as `[x]` without explicit maintainer confirmation.

4. If a task needs rework after review, change `[-]` back to `[~]` with notes.

5. **Build failures are blockers**: Do not mark a task as complete if `npm run build` fails.

### Example

```markdown
## Stop-the-World Mode
- [x] State machine implementation (VERIFIED)
- [-] Pronunciation evaluator (implemented, pending verification)
- [~] Grammar checker (partial, needs edge case handling)
- [ ] TTS playback (not started)
```

---

## Prerequisites

- Node.js 20+
- npm 10+
- At least one AI provider API key (OpenAI or Gemini)
- Optional: Azure Speech API key (for pronunciation assessment)

---

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd oralflow
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```bash
# Required: At least one AI provider
OPENAI_API_KEY=sk-your-openai-key
# OR
GEMINI_API_KEY=your-gemini-key

# Optional: Additional providers
AIHUBMIX_API_KEY=your-aihubmix-key
AIHUBMIX_BASE_URL=https://aihubmix.com/v1
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional: Azure Speech (for pronunciation assessment)
AZURE_SPEECH_KEY=your-azure-key
AZURE_SPEECH_REGION=eastus

# Storage path (default: ./data/storage)
LOCAL_STORAGE_PATH=./data/storage
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npx playwright test` | Run E2E tests |

---

## Quality Gate

**Before committing any changes**, ensure all of the following commands pass:

```bash
npm run build && npm test && npm run lint
```

### Requirements

1. **`npm run build`** - Production build must succeed without errors
2. **`npm test`** - All tests must pass
3. **`npm run lint`** - No linting errors

All three checks are **mandatory** after each development task.

---

## Project Architecture

### Directory Structure

```
src/
├── app/                  # Next.js pages and API routes
├── components/           # React components
├── domains/              # Business logic (services, models)
├── services/             # Infrastructure (AI, persistence)
└── lib/                  # Utilities (i18n, validation)
```

### Key Patterns

- **Domain modules** encapsulate business logic
- **Components** delegate to services/hooks
- **Zod schemas** validate API requests
- **Repository pattern** for persistence

---

## Testing

### Test Structure

```
tests/
├── unit/                 # Unit tests for domains/services
├── integration/          # API route tests
└── e2e/                  # Playwright E2E tests
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Specific file
npm test -- path/to/test.ts

# E2E tests
npx playwright test

# E2E with UI
npx playwright test --ui
```

### Writing Tests

- Unit tests: Test domain services in isolation
- Integration tests: Test API routes with mocked dependencies
- E2E tests: Test full user journeys

---

## Code Style

### TypeScript

- Strict mode enabled
- Prefer explicit types over inference for function parameters
- Use Zod for runtime validation

### React

- Functional components only
- Use hooks for state management
- Prefer composition over inheritance

### File Naming

- Components: `PascalCase.tsx`
- Services: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts`

---

## Feature Development Walkthrough

### Home Dashboard

Navigate to `/` to see:
- Practice stats (time, review cards)
- Quick action cards
- Continue practicing section

### Stop-the-World Mode

1. Go to `/stw` or launch from Scenarios
2. AI starts conversation
3. Press Record to respond
4. View evaluation feedback
5. Retry or Send to continue
6. Use Copilot panel for Distill/Inspiration

### Zen Mode

1. Go to `/zen` or launch from Scenarios
2. Speak naturally with AI
3. Toggle transcript visibility
4. End session to see evaluation report
5. Save extracted expressions

### Scenario Studio

1. Go to `/scenarios/create`
2. Choose: Manual Draft, AI Generate, or Import Text
3. Edit normalized scenario card
4. Accept to save to library
5. Launch with Launchpad (StW or Zen)

### Free Chat

1. Go to `/free-chat`
2. Paste any text as context
3. Optionally customize title/roles
4. Click "Prepare with AI"
5. Launch in StW or Zen

### Ask Page

1. Go to `/ask`
2. Enter prompt like "How do I politely decline?"
3. Review tone-specific suggestions
4. Save to Notebook with one click

### Notebook

1. Go to `/notebook`
2. View saved expressions
3. Edit, delete, or manage items

### Training

1. Go to `/training`
2. Complete daily review queue
3. Rate items: Forgot / Hard / Good / Easy
4. See updated schedule

### AI Model Configuration

1. Go to `/models`
2. View provider status
3. Add models to categories
4. Assign models to capabilities

---

## Data Storage

By default, data is stored in:
- SQLite database: `./data/storage/oralflow.db`
- AI settings: `./data/storage/ai-settings.json`

To reset data:

```bash
rm -rf ./data/storage
```

---

## Troubleshooting

### "No AI provider configured"

Ensure at least one of these is set in `.env`:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Restart the dev server after changes.

### SQLite errors

If you see native module errors:

1. Delete `node_modules`
2. Run `npm install`
3. Rebuild native modules: `npm rebuild better-sqlite3`

JSON fallback is deprecated; ensure SQLite is available.

### Pronunciation assessment not working

Ensure Azure Speech credentials are configured:
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`

The feature works without Azure but won't show pronunciation scores.

---

## Contributing

### Workflow

1. Create feature branch from `001-speaking-practice`
2. Implement with tests
3. **Run quality checks**: `npm run build && npm test && npm run lint`
4. **Auto-commit and Push**: Once checks pass, automatically commit and push using conventional commits (remove data/ folder).
5. Ensure all checks pass before committing
6. Submit PR with description

### Commit Messages

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Keep subject line under 72 characters
- Reference issues when applicable

### PR Requirements

- **Production build succeeds**: `npm run build` passes
- **All tests pass**: `npm test` passes
- **No linting errors**: `npm run lint` passes
- **TypeScript compiles** without errors
- **Description** explains the change

**Critical**: Every PR must pass the full quality gate (`npm run build && npm test && npm run lint`) before review.

---

## Adding New Features

### Adding a New Domain

1. Create folder in `src/domains/`
2. Add `models.ts` for entities
3. Add `*-service.ts` for business logic
4. Export from `index.ts`

### Adding a New API Route

1. Create route in `src/app/api/`
2. Add Zod schema in `src/lib/validation/`
3. Use domain services for logic
4. Add integration tests

### Adding a New Component

1. Create in appropriate `src/components/` subfolder
2. Use Tailwind for styling
3. Follow existing patterns
4. Add component tests if complex

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | One of | OpenAI API key |
| `GEMINI_API_KEY` | these | Google Gemini API key |
| `AIHUBMIX_API_KEY` | No | AiHubMix API key |
| `AIHUBMIX_BASE_URL` | No | AiHubMix base URL |
| `OPENROUTER_API_KEY` | No | OpenRouter API key |
| `OPENROUTER_BASE_URL` | No | OpenRouter base URL |
| `AZURE_SPEECH_KEY` | No | Azure Speech API key |
| `AZURE_SPEECH_REGION` | No | Azure Speech region |
| `LOCAL_STORAGE_PATH` | No | Data storage path |
