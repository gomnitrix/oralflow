# OralFlow Documentation

**Last Updated**: 2026-01-23

This folder contains the product and development documentation for OralFlow.

## Documents

| Document | Description |
|----------|-------------|
| [PRODUCT.md](./PRODUCT.md) | Complete product documentation: features, data models, API reference, design system |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Developer guide: setup, commands, testing, contributing |
| [TASKS.md](./TASKS.md) | Implementation status and remaining work |

## Quick Links

- **Getting Started**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **What's Implemented**: See [TASKS.md](./TASKS.md)
- **Feature Details**: See [PRODUCT.md](./PRODUCT.md)

## Archive

Historical planning documents from before implementation are preserved in the `archive/` folder for reference.

## Project Overview

OralFlow is an AI-powered English speaking practice application with:

- **Stop-the-World Mode**: High-scaffolding coaching with evaluation gating
- **Zen Mode**: Real-time immersive conversation
- **Scenario Studio**: Create and manage practice scenarios
- **Notebook**: Save and organize expressions
- **Training**: SRS-based spaced repetition review
- **Ask**: Expression discovery

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- SQLite (better-sqlite3) + JSON fallback
- OpenAI / Gemini / Azure Speech SDK
- Tailwind CSS + Lexend font

## Commands

```bash
npm run dev      # Start dev server
npm test         # Run tests
npm run lint     # Run linter
npm run build    # Production build
```
