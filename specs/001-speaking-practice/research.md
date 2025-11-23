# Research & Decisions: Oralflow Speaking Practice Loop

**Branch**: `001-speaking-practice`  
**Date**: 2025-11-23  
**Related Spec**: `/workspaces/oralflow/specs/001-speaking-practice/spec.md`  
**Related Plan**: `/workspaces/oralflow/specs/001-speaking-practice/plan.md`

## Unknowns and Questions

1. Next.js routing style and state management for domain modules.
2. Choice of testing stack compatible with Next.js + TypeScript.
3. Local persistence approach for single-user MVP that can later migrate to a multi-user backend.
4. Realtime API integration patterns for Zen Mode (OpenAI/Realtime vs Gemini Live).
5. How to apply UI-sketch HTML prototypes without locking into brittle markup.

All items are resolved below; no `[NEEDS CLARIFICATION]` markers remain for the MVP scope.

## Decisions

### Decision 1: Next.js App Architecture

- **Decision**: Use Next.js App Router with TypeScript, domain-layer modules, and server actions/API routes for backend logic.
- **Rationale**: App Router is the modern Next.js standard for co-locating UI and data loading, and it fits a monolithic architecture with domains like conversation, copilot, training, etc. Keeping domain logic in `src/domains` and thin page components in `src/app` maintains separation of concerns while leveraging server components where appropriate.
- **Alternatives considered**:
  - Pages Router with custom API routes everywhere: compatible but less aligned with current Next.js guidance and would fragment layout logic.
  - Splitting frontend and backend into separate projects: would increase complexity and violate the simplicity preference for this MVP.

### Decision 2: State Management

- **Decision**: Use React built-in state and context plus small custom hooks for cross-cutting state (e.g., active conversation/session, current scenario, SRS queues).
- **Rationale**: The constitution prefers clarity over cleverness and a small, predictable stack. React context/hooks are sufficient for a single-app MVP and keep the mental model simple; domain services own most logic and can be unit-tested independently of UI.
- **Alternatives considered**:
  - Redux or Zustand: powerful but unnecessary for the initial scale; adds boilerplate and a second mental model.
  - Heavy global state libraries for realtime: overkill given Zen mode can manage its own connection state via dedicated hooks.

### Decision 3: Testing Stack

- **Decision**: Use Jest (or Vitest) with React Testing Library for unit and integration tests, plus Playwright for end-to-end tests.
- **Rationale**: These tools are widely used in the Next.js ecosystem, integrate well with TypeScript, and cover the constitution’s requirement for unit, integration, and E2E coverage on critical loops.
- **Alternatives considered**:
  - Cypress for E2E: excellent developer experience, but Playwright’s first-class cross-browser support and parallelization make it slightly better for CI-heavy workflows.
  - Relying only on E2E tests: would be slower and make debugging core logic (SRS, evaluation) harder.

### Decision 4: Local Persistence Strategy

- **Decision**: Implement a repository layer in Node that persists normalized data to a single local store (e.g., SQLite or structured file-based JSON) via a `storage-adapter`, with entities for scenarios, sessions, notebook items, and SRS review tasks.
- **Rationale**: The MVP is single-user and does not require multi-tenant auth. Abstracting repositories behind a storage adapter keeps the boundary ready for future migration to Postgres or other databases without rewriting domains.
- **Alternatives considered**:
  - In-memory only storage: simplest but loses data on restart and breaks the idea of long-term SRS and notebook history.
  - Locking into a cloud database early: premature complexity for a local-first MVP and harder for contributors to run locally.

### Decision 5: Realtime APIs for Zen Mode

- **Decision**: Design a generic realtime interface in `services/ai/client.ts` that can speak to either OpenAI Realtime API or Gemini Live API, selected via environment configuration, with Zen-mode-specific orchestration in `domains/conversation/zen-service.ts`.
- **Rationale**: The product brief requires flexibility between providers. A thin abstraction layer around realtime streaming lets Zen mode code remain stable while the underlying provider can change via configuration.
- **Alternatives considered**:
  - Hardwiring a single provider: simpler short term but conflicts with the requirement to support different Realtime APIs.
  - Custom websocket infrastructure on top of regular LLM APIs: unnecessary duplication of capabilities that providers already offer.

### Decision 6: Applying UI-Sketch Prototypes

- **Decision**: Use files under `/UI-sketch` strictly as visual and structural references. Translate them into reusable React components styled with Tailwind, enforcing a common design system (spacing scale, typography, components, interaction patterns).
- **Rationale**: The prototypes quickly communicate intent, but copying markup directly would lead to drift and inconsistencies. A consistent component library better supports responsiveness, maintainability, and localization.
- **Alternatives considered**:
  - Directly importing or rendering HTML prototypes: would hinder accessibility, theming, and responsive behavior.
  - Ignoring prototypes entirely: would lose the alignment between product expectations and implementation.

### Decision 7: Internationalization Strategy

- **Decision**: Implement a simple key-based i18n layer under `src/lib/i18n` with message catalogs for English and Chinese, and use it in all user-facing strings (UI labels, helper copy, non-AI text).
- **Rationale**: Localization is a core requirement. A lightweight i18n helper keeps implementation simple while ensuring strings are centralised and easy to extend to more locales.
- **Alternatives considered**:
  - Deferring i18n until later: would cause scattered hard-coded strings and costly retrofitting.
  - Heavy i18n frameworks: unnecessary for the small initial set of locales.

## Best Practices Tasks (Derived from Decisions)

- Define coding guidelines for domain modules (strict types, no implicit any, pure functions where possible).
- Establish test naming and folder conventions (unit/integration/e2e) aligned with the `src` structure.
- Document how to add new AI prompts or providers via the unified AI client.
- Provide examples of converting UI-sketch HTML snippets into React components with Tailwind classes and shared tokens.
- Document how to evolve the storage adapter from local single-user persistence to a future multi-user database.

## Summary

The research confirms that a single Next.js monolith with domain modules, a unified AI service, lightweight state management, and a thin storage adapter is sufficient for the MVP while aligning with the Oralflow constitution. Realtime APIs, testing tools, and UI-sketch prototypes are all integrated via explicit, well-documented boundaries, reducing risk for later iteration.
