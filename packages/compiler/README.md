# @webforge/compiler

The compiler that turns structured requirements (answers) and capability modules into a canonical **AppSpec**.

## Responsibility

```
Answers / Requirements
         ↓
      Compiler
         ↓
      AppSpec
```

`@webforge/compiler` is responsible for deterministically generating a unified, validated AppSpec from structured inputs.

## Planned Features

- **Answer Resolution**: Normalizing and validating questionnaire answers.
- **Module Selection**: Selecting appropriate functional modules based on requirements.
- **Module Dependency Resolution**: Resolving prerequisites and ordering.
- **Fragment Merging**: Deterministically merging schema fragments, routes, and configs.
- **Conflict Detection**: Explicitly detecting conflicts (entities, pages, fields) rather than silently overwriting data.
- **AppSpec Validation**: Ensuring the resulting AppSpec conforms to `@webforge/spec`.

## Status

**Scaffolding only.** Compiler logic will be implemented in future phases.
