# @webforge/spec

The canonical **AppSpec** definition, structural schemas, semantic validation engine, and deterministic serialization for WebForge.

## Overview

`@webforge/spec` defines the single source of truth for WebForge applications. It is strictly declarative and completely independent of any runtime implementation, hosting environment, database engine, or frontend framework.

```
User Requirements (WHAT)
         ↓
  WebForge Compiler
         ↓
      AppSpec (Single Source of Truth)
         ↓
  Generic Engines (Data, API, UI, Admin)
```

## Public API

```typescript
import {
  AppSpecSchema,
  parseAppSpec,
  safeParseAppSpec,
  validateAppSpec,
  validateAppSpecFull,
  canonicalizeAppSpec,
  CURRENT_APPSPEC_VERSION,
  // Schemas, Types, and Fixtures
} from '@webforge/spec';
```

### Validation Layers

1. **Structural Validation (`parseAppSpec` / `safeParseAppSpec`)**:
   - Zod runtime schema parsing
   - Validates discriminated unions, property types, required fields, and nested structures.

2. **Semantic Validation (`validateAppSpec`)**:
   - Pure semantic integrity checker
   - Global ID uniqueness
   - Key uniqueness within entity, page, menu, rule, role namespaces
   - Reference field targets (`targetEntityId`)
   - Constraint field existence & composite uniqueness
   - Ownership declarations and policy scoping
   - Action and DataBinding target validity
   - Rule entity and field mapping integrity
   - Asset, Menu, Layout, and Role referential integrity

3. **Combined Validation (`validateAppSpecFull`)**:
   - Runs structural validation followed by semantic validation in a unified result.

### Canonical Serialization (`canonicalizeAppSpec`)

Produces deterministic, stably sorted JSON strings suitable for diffing, testing snapshots, and reproducibility.

## Golden Application Fixtures

The package includes validated representative fixtures for the six golden application archetypes:

1. **E-Commerce** (`ecommerceFixture`): Product, Category, Cart, CartItem, Order, OrderItem, Customer, Review.
2. **Education / EdTech** (`educationFixture`): Course, Module, Lesson, Enrollment, Student, Instructor, Assignment.
3. **Event Management** (`eventManagementFixture`): Event, Venue, TicketType, Registration, Attendee, Speaker.
4. **Booking / Appointments** (`bookingFixture`): Service, StaffMember, Location, ScheduleSlot, Booking, Client.
5. **Job Board / Recruitment** (`jobBoardFixture`): JobListing, Company, Application, Candidate, JobCategory, Skill.
6. **Business / Service Website** (`businessServiceFixture`): ServiceOffering, TeamMember, CaseStudy, ContactSubmission (`persist: false`).
