# Oralflow Constitution

## Core Principles

### I. Code Quality
- All application code is written in TypeScript with strict type safety and lint-enforced conventions (ESLint + Prettier).
- Maintain a clean, modular architecture that separates UI, business logic, and data access layers with no hidden side effects.
- Source remains readable, self-describing, and well-documented so that intent is always obvious to new contributors.
- Sensitive configuration (tokens, API keys, secrets) must come from environment variables; never hard-code them.

### II. Testing Standards
- Every core feature is protected by automated tests that match the layer: unit for logic, integration for flows, end-to-end for journeys.
- Critical language-learning loops (conversation, evaluation, spaced repetition) require explicit regression coverage.
- GitHub Actions must run linting, type checks, and the entire test suite on each pull request.

### III. User Experience Consistency
- UX must remain intuitive for beginner-to-intermediate language learners and preserve flow-state immersion.
- Components follow consistent interaction paradigms, remain responsive across desktop/tablet/mobile, and avoid cognitive load spikes.
- Conversational coaching surfaces stay safe, supportive, and localization-ready for English and Chinese with a path to more locales.

### IV. Performance Requirements
- Optimize for perceived responsiveness without sacrificing clarity; no blocking UI or jittery streaming in real-time modes.
- Non-real-time evaluation flows must stay fast and predictable, and the architecture must scale without rewrites.

### V. Security and Data Responsibility
- Protect user-generated recordings, notes, and history with secure storage practices and explicit, documented purpose.
- Never persist sensitive data unless required, and always document why it is retained and how it is protected.
- Provide sensitive tokens exclusively via environment variables; never commit or hard-code them in the repository.

## Developer Experience
- Maintain a predictable folder structure, explicit naming, and descriptive comments only where logic is non-obvious.
- Prefer clarity over cleverness; avoid implicit behavior and make side effects explicit.
- Keep onboarding friction low through consistent patterns, reusable modules, and documentation that explains rationale plus integration notes.

## Governance
- This constitution supersedes other practices when conflicts arise; exceptions require documented justification and approval.
- Pull requests must confirm compliance with these principles, and deviations need a migration plan plus timeline.

**Version**: 1.0.0 | **Ratified**: 2025-11-23 | **Last Amended**: 2025-11-23
