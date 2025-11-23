# Testing Guide

## Commands

- Run unit/integration lint gate: `npm test && npm run lint`
- Run Playwright E2E: `npx playwright test`

## Structure

- `tests/unit`: domain and service unit tests.
- `tests/integration`: API routes and server actions.
- `tests/e2e`: Playwright specs aligned to Quickstart scenarios.

## Setup

1. Ensure environment variables are configured as in `docs/setup/speaking-loop.md`.
2. Start the Next.js dev server: `npm run dev`.
3. For E2E, set `PLAYWRIGHT_BASE_URL` if not running on `http://localhost:3000`.
