# @webforge/spec

The canonical **AppSpec** definition and schemas for WebForge.

## Responsibility

`@webforge/spec` defines the single source of truth for WebForge applications. It is strictly declarative and completely independent of any runtime implementation, hosting environment, database engine, or frontend framework.

## Planned Contents

- **AppSpec Types & Schemas**: TypeScript types and Zod schemas for runtime validation.
- **Entities & Fields**: Declarative schemas for data models, validation constraints, and indexing.
- **Relationships**: 1:1, 1:N, and N:M data associations.
- **Pages & Blocks**: Layout, block hierarchy, and rendering tree definitions.
- **Users, Roles & Permissions**: Access control models (RBAC/ABAC).
- **Rules & Workflows**: Business logic constraints and state machines.
- **Themes**: Visual tokens, typography, and styling specifications.
- **Integrations**: Declarative external service configurations.
- **Schema Versioning**: Versioning metadata distinguishing AppSpec format versions from application data schemas.

## Status

**Scaffolding only.** Actual schemas and models will be implemented in subsequent phases.
