import { z } from 'zod';
import { SelectOptionSchema, type SelectOption, type FieldSpec } from '@webforge/spec';
import type { Module, ModuleContext, SpecFragment } from '../../types.js';

export interface BookingModuleParams {
  statuses?: SelectOption[];
  slotIntervalMinutes?: number;
  enableServicePricing?: boolean;
}

export const bookingModuleParamsSchema = z.object({
  statuses: z.array(SelectOptionSchema).default([
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]),
  slotIntervalMinutes: z.number().int().positive().default(30),
  enableServicePricing: z.boolean().default(true),
});

/**
 * Booking & Scheduling capability module.
 * Provides Service -> ScheduleSlot -> Booking relational models and reservation workflows.
 */
export const bookingModule: Module<BookingModuleParams> = {
  id: 'booking',
  requires: ['auth'],
  params: bookingModuleParamsSchema,
  contribute: (params: BookingModuleParams, ctx: ModuleContext): SpecFragment => {
    const authUserEntityId = ctx.forModule('auth').toEntityId('user');

    const serviceEntityId = ctx.toEntityId('service');
    const slotEntityId = ctx.toEntityId('scheduleSlot');
    const bookingEntityId = ctx.toEntityId('booking');

    const serviceNameFieldId = ctx.toFieldId('service_name');
    const serviceSlugFieldId = ctx.toFieldId('service_slug');
    const serviceDescFieldId = ctx.toFieldId('service_desc');
    const serviceDurationFieldId = ctx.toFieldId('durationMinutes');
    const servicePriceFieldId = ctx.toFieldId('service_price');
    const serviceActiveFieldId = ctx.toFieldId('service_active');

    const slotServiceFieldId = ctx.toFieldId('slot_serviceId');
    const slotStartFieldId = ctx.toFieldId('startTime');
    const slotEndFieldId = ctx.toFieldId('endTime');
    const slotCapacityFieldId = ctx.toFieldId('capacity');
    const slotAvailableFieldId = ctx.toFieldId('isAvailable');

    const bookingSlotFieldId = ctx.toFieldId('slotId');
    const bookingUserFieldId = ctx.toFieldId('userId');
    const bookingStatusFieldId = ctx.toFieldId('status');
    const bookingNotesFieldId = ctx.toFieldId('notes');

    const enablePricing = params.enableServicePricing ?? true;
    const statuses = params.statuses ?? [
      { value: 'pending', label: 'Pending' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];

    const serviceFields: FieldSpec[] = [
      {
        id: serviceNameFieldId,
        key: 'name',
        label: 'Service Name',
        type: 'text',
        required: true,
        queryCapabilities: {
          searchable: true,
          sortable: true,
        },
      },
      {
        id: serviceSlugFieldId,
        key: 'slug',
        label: 'Slug',
        type: 'slug',
        required: true,
        config: {
          sourceFieldId: serviceNameFieldId,
        },
        queryCapabilities: {
          searchable: true,
          filterable: true,
        },
      },
      {
        id: serviceDescFieldId,
        key: 'description',
        label: 'Description',
        type: 'richText',
        required: false,
      },
      {
        id: serviceDurationFieldId,
        key: 'durationMinutes',
        label: 'Duration (minutes)',
        type: 'number',
        required: true,
        config: {
          integer: true,
          defaultValue: 60,
        },
        queryCapabilities: {
          filterable: true,
          sortable: true,
        },
      },
      {
        id: serviceActiveFieldId,
        key: 'active',
        label: 'Active',
        type: 'boolean',
        required: false,
        config: {
          defaultValue: true,
        },
        queryCapabilities: {
          filterable: true,
        },
      },
    ];

    if (enablePricing) {
      serviceFields.push({
        id: servicePriceFieldId,
        key: 'price',
        label: 'Price',
        type: 'money',
        required: false,
        queryCapabilities: {
          filterable: true,
          sortable: true,
        },
      });
    }

    return {
      entities: [
        // 1. Service
        {
          id: serviceEntityId,
          key: 'service',
          label: 'Bookable Service',
          pluralLabel: 'Bookable Services',
          fields: serviceFields,
          constraints: [
            {
              id: ctx.toConstraintId('unique_service_slug'),
              key: 'unique_service_slug',
              label: 'Unique service slug',
              type: 'unique',
              fieldId: serviceSlugFieldId,
            },
          ],
        },
        // 2. ScheduleSlot
        {
          id: slotEntityId,
          key: 'scheduleSlot',
          label: 'Schedule Slot',
          pluralLabel: 'Schedule Slots',
          fields: [
            {
              id: slotServiceFieldId,
              key: 'serviceId',
              label: 'Service',
              type: 'reference',
              required: true,
              config: {
                targetEntityId: serviceEntityId,
                onDelete: 'cascade',
              },
              queryCapabilities: {
                filterable: true,
              },
            },
            {
              id: slotStartFieldId,
              key: 'startTime',
              label: 'Start Time',
              type: 'datetime',
              required: true,
              queryCapabilities: {
                filterable: true,
                sortable: true,
              },
            },
            {
              id: slotEndFieldId,
              key: 'endTime',
              label: 'End Time',
              type: 'datetime',
              required: true,
              queryCapabilities: {
                filterable: true,
                sortable: true,
              },
            },
            {
              id: slotCapacityFieldId,
              key: 'capacity',
              label: 'Capacity',
              type: 'number',
              required: true,
              config: {
                integer: true,
                defaultValue: 1,
              },
            },
            {
              id: slotAvailableFieldId,
              key: 'isAvailable',
              label: 'Available',
              type: 'boolean',
              required: false,
              config: {
                defaultValue: true,
              },
              queryCapabilities: {
                filterable: true,
              },
            },
          ],
          constraints: [
            {
              id: ctx.toConstraintId('unique_service_start_slot'),
              key: 'unique_service_start_slot',
              label: 'Unique service start time',
              type: 'compositeUnique',
              fieldIds: [slotServiceFieldId, slotStartFieldId],
            },
          ],
        },
        // 3. Booking
        {
          id: bookingEntityId,
          key: 'booking',
          label: 'Booking',
          pluralLabel: 'Bookings',
          ownership: {
            ownerFieldId: bookingUserFieldId,
          },
          fields: [
            {
              id: bookingSlotFieldId,
              key: 'slotId',
              label: 'Schedule Slot',
              type: 'reference',
              required: true,
              config: {
                targetEntityId: slotEntityId,
                onDelete: 'restrict',
              },
              queryCapabilities: {
                filterable: true,
              },
            },
            {
              id: bookingUserFieldId,
              key: 'userId',
              label: 'Client User',
              type: 'reference',
              required: true,
              config: {
                targetEntityId: authUserEntityId,
                onDelete: 'cascade',
              },
              queryCapabilities: {
                filterable: true,
              },
            },
            {
              id: bookingStatusFieldId,
              key: 'status',
              label: 'Booking Status',
              type: 'select',
              required: true,
              config: {
                options: statuses,
                defaultValue: 'confirmed',
              },
              queryCapabilities: {
                filterable: true,
                sortable: true,
              },
            },
            {
              id: bookingNotesFieldId,
              key: 'notes',
              label: 'Notes',
              type: 'textarea',
              required: false,
            },
          ],
          constraints: [
            {
              id: ctx.toConstraintId('unique_user_slot_booking'),
              key: 'unique_user_slot_booking',
              label: 'One booking per user per slot',
              type: 'compositeUnique',
              fieldIds: [bookingUserFieldId, bookingSlotFieldId],
            },
          ],
        },
      ],
      access: {
        policies: [
          {
            id: ctx.toPolicyId('service_public_read'),
            subject: 'anonymous',
            entityId: serviceEntityId,
            operations: ['read'],
            scope: 'public',
          },
          {
            id: ctx.toPolicyId('slot_public_read'),
            subject: 'anonymous',
            entityId: slotEntityId,
            operations: ['read'],
            scope: 'public',
          },
          {
            id: ctx.toPolicyId('booking_auth_create'),
            subject: 'authenticated',
            entityId: bookingEntityId,
            operations: ['create'],
            scope: 'all',
          },
          {
            id: ctx.toPolicyId('booking_owner_manage'),
            subject: 'authenticated',
            entityId: bookingEntityId,
            operations: ['read', 'update', 'delete'],
            scope: 'own',
          },
        ],
      },
      admin: {
        resources: [
          {
            entityId: serviceEntityId,
            columns: [serviceNameFieldId, serviceDurationFieldId, serviceActiveFieldId],
            searchFields: [serviceNameFieldId],
          },
          {
            entityId: slotEntityId,
            columns: [slotServiceFieldId, slotStartFieldId, slotEndFieldId, slotAvailableFieldId],
            filterFields: [slotAvailableFieldId],
          },
          {
            entityId: bookingEntityId,
            columns: [bookingSlotFieldId, bookingUserFieldId, bookingStatusFieldId],
            filterFields: [bookingStatusFieldId],
          },
        ],
      },
    };
  },
};
