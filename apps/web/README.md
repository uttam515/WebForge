# @webforge/web

The WebForge builder web application.

## Overview

`@webforge/web` is the primary builder interface for WebForge, built with **Next.js (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

## Structure

```
apps/web/
├── app/
│   ├── layout.tsx         # Root HTML layout and global styles
│   ├── page.tsx           # Home builder entry page
│   ├── page.test.tsx      # Component unit test
│   └── globals.css        # Tailwind CSS entry point
├── next.config.ts         # Next.js configuration with workspace package transpilation
├── postcss.config.mjs     # PostCSS configuration for Tailwind CSS
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript strict configuration for Next.js
```

## Development Commands

```bash
# Start local development server
pnpm --filter @webforge/web dev

# Production build
pnpm --filter @webforge/web build

# Start production server
pnpm --filter @webforge/web start

# Type check
pnpm --filter @webforge/web typecheck
```

## Status

**Foundation scaffolded.** The full builder UI, questionnaire wizard, canvas editor, and live preview sandbox will be built in subsequent phases.
