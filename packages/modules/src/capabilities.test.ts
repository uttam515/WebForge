import { describe, it, expect } from 'vitest';
import { toAppSpecId, validateAppSpecFull, type AppSpecMetadata } from '@webforge/spec';

import {
  ModuleRegistry,
  DefaultModuleContext,
  composeAppSpec,
  authModule,
  profilesModule,
  catalogModule,
  reviewsModule,
  registrationModule,
  bookingModule,
  registerCoreCapabilities,
  getModuleDependencies,
  UndeclaredDependencyError,
  type Module,
  type EmptyModuleParams,
  emptyModuleParamsSchema,
} from './index.js';

const testMetadata: AppSpecMetadata = {
  id: toAppSpecId('app_capabilities_test'),
  name: 'Capabilities Test Application',
  description: 'Application testing core capability modules',
};

describe('@webforge/modules - Core Capabilities (Milestone 3A)', () => {
  describe('Auth Module', () => {
    it('should contribute valid User entity, auth configuration, and deterministic IDs', () => {
      const ctx = new DefaultModuleContext('auth');
      const fragment = authModule.contribute({}, ctx);

      expect(fragment.entities).toBeDefined();
      expect(fragment.entities!.length).toBe(1);

      const userEntity = fragment.entities![0]!;
      expect(userEntity.id).toBe('ent_auth_user');
      expect(userEntity.key).toBe('user');
      expect(userEntity.fields.map((f) => f.key)).toContain('email');
      expect(userEntity.fields.map((f) => f.key)).toContain('displayName');

      expect(fragment.auth).toBeDefined();
      expect(fragment.auth!.roles!.length).toBe(2);
      expect(fragment.auth!.signup!.enabled).toBe(true);
      expect(fragment.auth!.signup!.defaultRoleId).toBe('role_auth_user');
      expect(fragment.auth!.userEntityId).toBe('ent_auth_user');
    });

    it('should respect parameter overrides for default role and methods', () => {
      const ctx = new DefaultModuleContext('auth');
      const fragment = authModule.contribute(
        {
          allowSignup: false,
          defaultRoleKey: 'admin',
          methods: ['password', 'magic-link'],
        },
        ctx,
      );

      expect(fragment.auth!.signup!.enabled).toBe(false);
      expect(fragment.auth!.signup!.defaultRoleId).toBe('role_auth_admin');
      expect(fragment.auth!.methods).toEqual(['password', 'magic-link']);
    });
  });

  describe('Profiles Module', () => {
    it('should declare auth dependency and contribute Profile entity referencing auth User', () => {
      expect(profilesModule.requires).toEqual(['auth']);

      const ctx = new DefaultModuleContext('profiles');
      const fragment = profilesModule.contribute({}, ctx);

      expect(fragment.entities!.length).toBe(1);
      const profile = fragment.entities![0]!;
      expect(profile.id).toBe('ent_profiles_profile');
      expect(profile.ownership?.ownerFieldId).toBe('fld_profiles_userId');

      const userRefField = profile.fields.find((f) => f.key === 'userId')!;
      expect(userRefField.type).toBe('reference');
      if (userRefField.type === 'reference') {
        expect(userRefField.config.targetEntityId).toBe('ent_auth_user');
        expect(userRefField.config.onDelete).toBe('cascade');
      }

      // Constraints
      expect(profile.constraints!.length).toBe(2);
      expect(profile.constraints!.map((c) => c.key)).toContain('unique_user_profile');
      expect(profile.constraints!.map((c) => c.key)).toContain('unique_handle');
    });

    it('should support optional fields via parameters (phone, website)', () => {
      const ctx = new DefaultModuleContext('profiles');
      const fragment = profilesModule.contribute({ enablePhone: true, enableWebsite: true }, ctx);

      const fieldKeys = fragment.entities![0]!.fields.map((f) => f.key);
      expect(fieldKeys).toContain('phoneNumber');
      expect(fieldKeys).toContain('website');
      expect(fieldKeys).toContain('bio');
      expect(fieldKeys).toContain('avatarUrl');
    });
  });

  describe('Catalog Module', () => {
    it('should contribute Item and Category entities with valid slugs and references', () => {
      const ctx = new DefaultModuleContext('catalog');
      const fragment = catalogModule.contribute({}, ctx);

      expect(fragment.entities!.length).toBe(2);
      const catEntity = fragment.entities!.find((e) => e.key === 'category')!;
      const itemEntity = fragment.entities!.find((e) => e.key === 'item')!;

      expect(catEntity).toBeDefined();
      expect(itemEntity).toBeDefined();

      const catRefField = itemEntity.fields.find((f) => f.key === 'categoryId')!;
      expect(catRefField.type).toBe('reference');
      if (catRefField.type === 'reference') {
        expect(catRefField.config.targetEntityId).toBe('ent_catalog_category');
        expect(catRefField.config.onDelete).toBe('setNull');
      }

      // Public access policy
      expect(fragment.access!.policies.length).toBe(2);
    });

    it('should allow disabling categories and pricing for minimal content catalogs', () => {
      const ctx = new DefaultModuleContext('catalog');
      const fragment = catalogModule.contribute(
        {
          enableCategories: false,
          enablePricing: false,
          itemEntityKey: 'article',
          itemLabel: 'Article',
          itemPluralLabel: 'Articles',
        },
        ctx,
      );

      expect(fragment.entities!.length).toBe(1);
      const item = fragment.entities![0]!;
      expect(item.key).toBe('article');
      expect(item.label).toBe('Article');
      expect(item.fields.map((f) => f.key)).not.toContain('categoryId');
      expect(item.fields.map((f) => f.key)).not.toContain('price');
    });
  });

  describe('Reviews Module', () => {
    it('should target catalog item by default and declare auth and catalog dependencies', () => {
      const defaultDeps = getModuleDependencies(reviewsModule, {});
      expect(defaultDeps).toEqual(['auth', 'catalog']);

      const ctx = new DefaultModuleContext('reviews', new Set(['reviews', 'auth', 'catalog']));
      const fragment = reviewsModule.contribute({}, ctx);

      expect(fragment.entities!.length).toBe(1);
      const review = fragment.entities![0]!;
      expect(review.ownership?.ownerFieldId).toBe('fld_reviews_authorId');

      const authorField = review.fields.find((f) => f.key === 'authorId')!;
      const targetField = review.fields.find((f) => f.key === 'targetId')!;

      if (authorField.type === 'reference') {
        expect(authorField.config.targetEntityId).toBe('ent_auth_user');
      }
      if (targetField.type === 'reference') {
        expect(targetField.config.targetEntityId).toBe('ent_catalog_item');
      }

      // Composite unique constraint to prevent duplicate reviews
      const uniqueConstraint = review.constraints!.find(
        (c) => c.key === 'unique_user_target_review',
      )!;
      expect(uniqueConstraint.type).toBe('compositeUnique');
      if (uniqueConstraint.type === 'compositeUnique') {
        expect(uniqueConstraint.fieldIds).toEqual(['fld_reviews_authorId', 'fld_reviews_targetId']);
      }
    });

    it('should allow configuring a custom review target (e.g. booking) with dynamic requires', () => {
      const customParams = {
        target: {
          targetModuleId: 'booking',
          targetSlotKey: 'service',
        },
        minRating: 1,
        maxRating: 10,
      };

      const evaluatedDeps = getModuleDependencies(reviewsModule, customParams);
      expect(evaluatedDeps).toEqual(['auth', 'booking']);

      const ctx = new DefaultModuleContext('reviews', new Set(['reviews', 'auth', 'booking']));
      const fragment = reviewsModule.contribute(customParams, ctx);

      const review = fragment.entities![0]!;
      const targetField = review.fields.find((f) => f.key === 'targetId')!;
      if (targetField.type === 'reference') {
        expect(targetField.config.targetEntityId).toBe('ent_booking_service');
      }

      const ratingField = review.fields.find((f) => f.key === 'rating')!;
      if (ratingField.type === 'number') {
        expect(ratingField.validation?.max).toBe(10);
      }
    });

    it('should throw UndeclaredDependencyError when reviews attempts to reference an undeclared module', () => {
      // Only reviews and auth are allowed; catalog is undeclared
      const ctx = new DefaultModuleContext('reviews', new Set(['reviews', 'auth']));
      expect(() => reviewsModule.contribute({}, ctx)).toThrow(UndeclaredDependencyError);
    });
  });

  describe('Registration Module', () => {
    it('should declare auth and target dependencies when requireAuth is true', () => {
      const authParams = {
        target: {
          targetModuleId: 'events',
          targetSlotKey: 'event',
        },
        requireAuth: true,
      };

      const deps = getModuleDependencies(registrationModule, authParams);
      expect(deps).toEqual(['auth', 'events']);

      const ctx = new DefaultModuleContext(
        'registration',
        new Set(['registration', 'auth', 'events']),
      );
      const fragment = registrationModule.contribute(authParams, ctx);

      expect(fragment.entities!.length).toBe(1);
      const reg = fragment.entities![0]!;
      expect(reg.ownership?.ownerFieldId).toBe('fld_registration_userId');

      const targetField = reg.fields.find((f) => f.key === 'targetId')!;
      const userField = reg.fields.find((f) => f.key === 'userId')!;

      if (targetField.type === 'reference') {
        expect(targetField.config.targetEntityId).toBe('ent_events_event');
      }
      if (userField.type === 'reference') {
        expect(userField.config.targetEntityId).toBe('ent_auth_user');
      }

      const uniqueConstraint = reg.constraints!.find((c) => c.key === 'unique_registrant_target')!;
      expect(uniqueConstraint.type).toBe('compositeUnique');
    });

    it('should NOT declare auth dependency when requireAuth is false (guest registration)', () => {
      const guestParams = {
        target: {
          targetModuleId: 'events',
          targetSlotKey: 'event',
        },
        requireAuth: false,
      };

      const deps = getModuleDependencies(registrationModule, guestParams);
      expect(deps).toEqual(['events']);
      expect(deps).not.toContain('auth');

      // Guest registration context does not include auth
      const ctx = new DefaultModuleContext('registration', new Set(['registration', 'events']));
      const fragment = registrationModule.contribute(guestParams, ctx);

      const reg = fragment.entities![0]!;
      expect(reg.ownership).toBeUndefined();
      expect(reg.fields.map((f) => f.key)).toContain('email');
      expect(reg.fields.map((f) => f.key)).toContain('name');
      expect(reg.fields.map((f) => f.key)).not.toContain('userId');
    });

    it('should throw UndeclaredDependencyError when authenticated registration attempts to resolve auth without permission', () => {
      const authParams = {
        target: {
          targetModuleId: 'events',
          targetSlotKey: 'event',
        },
        requireAuth: true,
      };

      // Context missing 'auth'
      const ctx = new DefaultModuleContext('registration', new Set(['registration', 'events']));
      expect(() => registrationModule.contribute(authParams, ctx)).toThrow(
        UndeclaredDependencyError,
      );
    });
  });

  describe('Booking Module', () => {
    it('should contribute Service -> ScheduleSlot -> Booking relational hierarchy', () => {
      expect(bookingModule.requires).toEqual(['auth']);

      const ctx = new DefaultModuleContext('booking');
      const fragment = bookingModule.contribute({}, ctx);

      expect(fragment.entities!.length).toBe(3);
      const service = fragment.entities!.find((e) => e.key === 'service')!;
      const slot = fragment.entities!.find((e) => e.key === 'scheduleSlot')!;
      const booking = fragment.entities!.find((e) => e.key === 'booking')!;

      expect(service).toBeDefined();
      expect(slot).toBeDefined();
      expect(booking).toBeDefined();

      // Slot references Service
      const slotServiceField = slot.fields.find((f) => f.key === 'serviceId')!;
      if (slotServiceField.type === 'reference') {
        expect(slotServiceField.config.targetEntityId).toBe('ent_booking_service');
      }

      // Booking references Slot and Auth User
      const bookingSlotField = booking.fields.find((f) => f.key === 'slotId')!;
      const bookingUserField = booking.fields.find((f) => f.key === 'userId')!;

      if (bookingSlotField.type === 'reference') {
        expect(bookingSlotField.config.targetEntityId).toBe('ent_booking_scheduleSlot');
      }
      if (bookingUserField.type === 'reference') {
        expect(bookingUserField.config.targetEntityId).toBe('ent_auth_user');
      }

      expect(booking.ownership?.ownerFieldId).toBe('fld_booking_userId');
    });
  });

  describe('Multi-Module Compositions & Preset Independence', () => {
    it('should compose Commerce-like capability set (auth + profiles + catalog + reviews) into a valid AppSpec', () => {
      const registry = new ModuleRegistry();
      registerCoreCapabilities(registry);

      const result = composeAppSpec({
        metadata: testMetadata,
        registry,
        modules: [
          { id: 'auth', params: { allowSignup: true } },
          { id: 'profiles', params: { enableBio: true } },
          { id: 'catalog', params: { enableCategories: true, enablePricing: true } },
          { id: 'reviews', params: { minRating: 1, maxRating: 5 } },
        ],
      });

      expect(result.spec).toBeDefined();
      // Entities: user, profile, category, item, review
      expect(result.spec.entities.length).toBe(5);

      const validation = validateAppSpecFull(result.spec);
      expect(validation.valid).toBe(true);
    });

    it('should compose Booking-like capability set (auth + profiles + booking + reviews targeting service)', () => {
      const registry = new ModuleRegistry();
      registerCoreCapabilities(registry);

      const result = composeAppSpec({
        metadata: testMetadata,
        registry,
        modules: [
          { id: 'auth', params: {} },
          { id: 'profiles', params: {} },
          { id: 'booking', params: { enableServicePricing: true } },
          {
            id: 'reviews',
            params: {
              target: {
                targetModuleId: 'booking',
                targetSlotKey: 'service',
              },
            },
          },
        ],
      });

      expect(result.spec).toBeDefined();
      // Entities: user, profile, service, scheduleSlot, booking, review
      expect(result.spec.entities.length).toBe(6);

      const reviewEntity = result.spec.entities.find((e) => e.key === 'review')!;
      const targetField = reviewEntity.fields.find((f) => f.key === 'targetId')!;
      if (targetField.type === 'reference') {
        expect(targetField.config.targetEntityId).toBe('ent_booking_service');
      }

      const validation = validateAppSpecFull(result.spec);
      expect(validation.valid).toBe(true);
    });

    it('should compose Registration-like capability set (auth + profiles + custom event target + registration)', () => {
      const registry = new ModuleRegistry();
      registerCoreCapabilities(registry);

      // Custom Event module to test generic target reference
      const eventsModule: Module<EmptyModuleParams> = {
        id: 'events',
        params: emptyModuleParamsSchema,
        contribute: (_params, ctx) => ({
          entities: [
            {
              id: ctx.toEntityId('event'),
              key: 'event',
              label: 'Event',
              pluralLabel: 'Events',
              fields: [
                {
                  id: ctx.toFieldId('title'),
                  key: 'title',
                  label: 'Event Title',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        }),
      };
      registry.register(eventsModule);

      const result = composeAppSpec({
        metadata: testMetadata,
        registry,
        modules: [
          { id: 'auth', params: {} },
          { id: 'profiles', params: {} },
          { id: 'events', params: {} },
          {
            id: 'registration',
            params: {
              target: {
                targetModuleId: 'events',
                targetSlotKey: 'event',
              },
              requireAuth: true,
            },
          },
        ],
      });

      expect(result.spec).toBeDefined();
      // Entities: user, profile, event, registration
      expect(result.spec.entities.length).toBe(4);

      const regEntity = result.spec.entities.find((e) => e.key === 'registration')!;
      const targetField = regEntity.fields.find((f) => f.key === 'targetId')!;
      if (targetField.type === 'reference') {
        expect(targetField.config.targetEntityId).toBe('ent_events_event');
      }

      const validation = validateAppSpecFull(result.spec);
      expect(validation.valid).toBe(true);
    });

    it('should guarantee deterministic canonical output across repeated capability compilations', () => {
      const registry = new ModuleRegistry();
      registerCoreCapabilities(registry);

      const modulesInput = [
        { id: 'catalog', params: { enableCategories: true } },
        { id: 'auth', params: { allowSignup: true } },
        { id: 'reviews', params: {} },
        { id: 'profiles', params: {} },
      ];

      const run1 = composeAppSpec({ metadata: testMetadata, registry, modules: modulesInput });
      const run2 = composeAppSpec({
        metadata: testMetadata,
        registry,
        modules: [
          { id: 'profiles', params: {} },
          { id: 'reviews', params: {} },
          { id: 'auth', params: { allowSignup: true } },
          { id: 'catalog', params: { enableCategories: true } },
        ],
      });

      expect(run1.canonicalJson).toBe(run2.canonicalJson);
    });
  });
});
