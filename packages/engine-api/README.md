# @webforge/engine-api

Generic API request pipeline and execution engine for WebForge.

## Responsibility

```
Incoming Request
      ↓
Load AppSpec
      ↓
Find Entity
      ↓
Authorize
      ↓
Validate
      ↓
Rules / Hooks
      ↓
Database Operation (via engine-data)
```

`@webforge/engine-api` handles universal HTTP/RPC dispatching, route matching, authentication/authorization enforcement, input validation, rule execution, and data operations against the AppSpec definition.

## Status

**Scaffolding only.** The generic API engine pipeline will be implemented in future phases.
