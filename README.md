# WebForge

> **WebForge is a schema-driven no-code application compiler that turns structured requirements into functional web applications.**

---

## 1. What is WebForge?

WebForge is a platform for building production-ready, standalone web applications from structured requirements. Rather than generating brittle, arbitrary code strings with LLMs, WebForge operates on a deterministic compilation model:

```
User Requirements (WHAT)
         ↓
  WebForge Compiler
         ↓
      AppSpec (Single Source of Truth)
         ↓
  Generic Engines (Data, API, UI, Admin)
         ↓
Production-Ready Application
```

### Core Philosophy

1. **User defines WHAT they want** → WebForge compiles it into an **AppSpec** → generic engines turn the AppSpec into a functional application.
2. **AppSpec is the single source of truth**: Visual builders, structured questionnaires, and AI assistants all produce or modify AppSpec. They never independently define runtime behavior.
3. **WebForge is NOT primarily an AI code generator**: AI is treated as an intelligent conversational interface for inspecting and modifying the AppSpec, not an unconstrained code emitter.

---

## 2. High-Level Architecture & Dependency Direction

The monorepo enforces a strict unidirectional dependency graph. Lower-level packages never depend on higher-level packages or consumer applications:

```
                  ┌─────────────┐
                  │  apps/web   │
                  └──────┬──────┘
                         │
     ┌───────────────────┼───────────────────┐
     ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐    ┌──────────────┐
│questionnaire │  │   compiler   │    │ engine-admin │
└──────┬───────┘  └──────┬───────┘    └──────┬───────┘
       │                 │                   │
       │          ┌──────┴───────┐    ┌──────┴───────┐
       │          ▼              │    ▼              │
       │    ┌───────────┐        │  ┌───────────┐    │
       │    │  modules  │        │  │ engine-ui │    │
       │    └─────┬─────┘        │  └─────┬─────┘    │
       │          │              │        │          │
       │          │       ┌──────┴──────┐ │          │
       │          │       ▼             │ │          │
       │          │  ┌────────────┐     │ │          │
       │          │  │ engine-api │     │ │          │
       │          │  └─────┬──────┘     │ │          │
       │          │        ▼            │ │          │
       │          │  ┌─────────────┐    │ │          │
       │          │  │ engine-data │    │ │          │
       │          │  └─────┬───────┘    │ │          │
       │          │        │            │ │          │
       ▼          ▼        ▼            ▼ ▼          ▼
     ┌─────────────────────────────────────────────────┐
     │                @webforge/spec                   │
     │      (Canonical Schemas & Declarations)         │
     └─────────────────────────────────────────────────┘
```

---

## 3. Project Status

| Layer                       | Status             | Description                                                                                                                           |
| --------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo Foundation**     | ✅ **Implemented** | pnpm workspaces, TypeScript project references, Zod boundary validation setup, Vitest suite, ESLint flat config, Prettier formatting. |
| **@webforge/spec**          | 🟡 **Planned**     | Canonical Zod schemas and TypeScript types for entities, fields, relations, permissions, pages, and themes.                           |
| **@webforge/compiler**      | 🟡 **Planned**     | Deterministic compiler: answer resolution, module selection, topological sorting, fragment merging, and conflict detection.           |
| **@webforge/modules**       | 🟡 **Planned**     | Domain capability modules (auth, ecommerce, events, blog, gallery, registration).                                                     |
| **@webforge/questionnaire** | 🟡 **Planned**     | Dynamic questionnaire trees, conditional branching logic, default inference, and answer resolution.                                   |
| **@webforge/engine-data**   | 🟡 **Planned**     | Generic data persistence, CRUD operations, relations, filtering, sorting, and pagination.                                             |
| **@webforge/engine-api**    | 🟡 **Planned**     | Universal request pipeline: auth, validation, lifecycle rules, and data execution.                                                    |
| **@webforge/engine-ui**     | 🟡 **Planned**     | Declarative page renderer, block registry, field component mapping, and theme engine.                                                 |
| **@webforge/engine-admin**  | 🟡 **Planned**     | Automated admin dashboard generator (data tables, forms, filters, bulk actions).                                                      |
| **apps/web**                | 🔵 **Future**      | Visual builder application, live preview sandbox, and compilation manager.                                                            |
| **AI Interface**            | 🔵 **Future**      | Conversational agent interface for mutating and reasoning over AppSpec models.                                                        |

---

## 4. Repository Structure

```
webforge/
├── apps/
│   └── web/                   # WebForge builder web application
│
├── packages/
│   ├── spec/                  # Canonical AppSpec schema and type definitions
│   ├── compiler/              # Requirements & modules → AppSpec compiler
│   ├── modules/               # Functional capability modules (auth, ecommerce, etc.)
│   ├── questionnaire/         # Structured requirements gathering & question engine
│   ├── engine-data/           # Generic data engine (CRUD, validation, querying, relations)
│   ├── engine-api/            # Generic API pipeline (authorization, validation, rules)
│   ├── engine-ui/             # Generic UI engine (page renderer, blocks, fields, forms)
│   └── engine-admin/          # Auto-generated admin dashboard engine
│
├── .editorconfig              # Editor consistency rules
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier code formatting rules
├── eslint.config.js           # Flat ESLint configuration with typescript-eslint
├── package.json               # Monorepo root package configuration
├── pnpm-workspace.yaml        # pnpm workspace package definitions
├── tsconfig.base.json         # Base TypeScript configuration
├── tsconfig.json              # Root TypeScript project references configuration
├── vitest.config.ts           # Root Vitest test runner configuration
└── README.md                  # WebForge documentation
```

### Package Responsibilities

- **[`packages/spec`](file:///Users/uttam/WebForge/packages/spec)**: Canonical AppSpec definition containing entity schemas, field definitions, relationship types, page trees, block structures, permissions, business rules, themes, and schema versioning. Independent of runtime implementations.
- **[`packages/compiler`](file:///Users/uttam/WebForge/packages/compiler)**: Transforms structured answers and module capabilities into a valid, unified AppSpec. Handles answer resolution, module dependency resolution, fragment merging, and explicit conflict detection.
- **[`packages/modules`](file:///Users/uttam/WebForge/packages/modules)**: Functional capability modules (authentication, e-commerce, events, blog, gallery, registration).
- **[`packages/questionnaire`](file:///Users/uttam/WebForge/packages/questionnaire)**: Manages question schemas, branching logic, conditional prerequisites, default heuristics, and answer normalization.
- **[`packages/engine-data`](file:///Users/uttam/WebForge/packages/engine-data)**: Generic data persistence engine providing entity validation, CRUD, relations (1:1, 1:N, N:M), filtering, sorting, pagination, and transactions.
- **[`packages/engine-api`](file:///Users/uttam/WebForge/packages/engine-api)**: Generic request pipeline handling request dispatch, authentication, authorization, payload validation, rule execution, and data mutations.
- **[`packages/engine-ui`](file:///Users/uttam/WebForge/packages/engine-ui)**: Generic UI system providing page rendering, block registry, dynamic form generation, entity lists/details, and theme token styling.
- **[`packages/engine-admin`](file:///Users/uttam/WebForge/packages/engine-admin)**: Automated administrative dashboard generator supplying data tables, search/filter controls, bulk operations, and role-based navigation.
- **[`apps/web`](file:///Users/uttam/WebForge/apps/web)**: WebForge builder visual interface and studio.

---

## 5. Architectural Principles

Every contribution to WebForge must uphold these 10 core architectural principles:

### 1. AppSpec is the Single Source of Truth

The questionnaire, visual editor, and future AI interfaces all modify or produce an AppSpec. They must never independently define application behavior outside of the AppSpec.

### 2. AppSpec is Independent of Hosting

The AppSpec must never depend on WebForge hosting, Vercel, AWS, GitHub, a specific database vendor, or a specific frontend framework.

### 3. Modular Generation

V1 generates applications from a clean core runtime plus required capability modules. We do not attempt brittle, line-level source string generation in V1.

### 4. Generated Applications Should Be Standalone

A generated application must be fully capable of executing independently of the WebForge builder platform.

### 5. Separate Identities

There are two fundamentally distinct user tiers:

- **WebForge users**: Own and build WebForge projects.
- **Generated-app users**: End users interacting with a generated application.

Never mix their authentication, session storage, or authorization models.

### 6. Project Isolation

Generated applications must never accidentally access or leak another generated project's data or runtime context.

### 7. Determinism

Given identical normalized requirements and module versions, the compiler must always produce the exact same AppSpec. Avoid random IDs or non-deterministic ordering; use stable identifiers.

### 8. Version AppSpec from Day One

Every AppSpec must include a schema format version. Distinguish between the **AppSpec format version** (e.g. `1.0.0`) and the **generated application's data/schema version**.

### 9. No Silent Conflicts

If multiple modules contribute conflicting entities, routes, fields, or configurations, the compiler must explicitly detect the collision and error out rather than silently overwriting data.

### 10. Generic Engines, Not App-Specific Hacks

Avoid conditional domain logic inside generic engines (e.g. `if (ecommerce) ...`). All domain-specific behaviors must be declared through modules and the AppSpec.

---

## 6. Development Commands

### Installation

```bash
pnpm install
```

### Type Checking

```bash
pnpm typecheck
```

### Building All Packages

```bash
pnpm build
```

### Running Tests

```bash
pnpm test
```

### Running Tests in Watch Mode

```bash
pnpm test:watch
```

### Linting

```bash
pnpm lint
# or auto-fix:
pnpm lint:fix
```

### Code Formatting

```bash
pnpm format:check
# or auto-format:
pnpm format
```

### Cleaning Build Artifacts

```bash
pnpm clean
```
