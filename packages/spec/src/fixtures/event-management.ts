import type { AppSpec } from '../app-spec.js';
import {
  toAppSpecId,
  toEntityId,
  toFieldId,
  toConstraintId,
  toPageId,
  toLayoutId,
  toBlockId,
  toRuleId,
  toAssetId,
  toRoleId,
  toMenuId,
  toMenuItemId,
  toPolicyId,
} from '../identity.js';

export const eventManagementFixture: AppSpec = {
  schemaVersion: '1.0.0',
  metadata: {
    id: toAppSpecId('app_event_v1'),
    name: 'SummitFlow',
    description: 'Conferences and event ticketing platform',
    origin: 'event-starter',
  },
  settings: {
    locale: 'en-US',
    timezone: 'America/Chicago',
    currency: 'USD',
    brand: {
      name: 'SummitFlow',
      logoAssetId: toAssetId('asset_evt_logo'),
      tagline: 'Connect, learn, and grow at world-class events',
    },
    defaultSEO: {
      title: 'SummitFlow | Conferences & Event Management',
      description: 'Discover upcoming summits and register for tickets.',
    },
  },
  assets: [
    {
      id: toAssetId('asset_evt_logo'),
      key: 'summit_logo',
      kind: 'image',
      mimeType: 'image/svg+xml',
      alt: 'SummitFlow Logo',
      visibility: 'public',
    },
  ],
  auth: {
    methods: ['password', 'magic-link'],
    signup: {
      enabled: true,
      defaultRoleId: toRoleId('role_attendee'),
    },
    roles: [
      {
        id: toRoleId('role_attendee'),
        key: 'attendee',
        label: 'Attendee',
      },
      {
        id: toRoleId('role_organizer'),
        key: 'organizer',
        label: 'Organizer',
      },
    ],
    userEntityId: toEntityId('ent_attendee'),
  },
  entities: [
    {
      id: toEntityId('ent_attendee'),
      key: 'attendee',
      label: 'Attendee',
      pluralLabel: 'Attendees',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_att_email'),
          key: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          queryable: { filterable: true, searchable: true },
        },
        {
          id: toFieldId('fld_att_name'),
          key: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          queryable: { searchable: true },
        },
      ],
      constraints: [
        {
          id: toConstraintId('cst_att_email_unique'),
          key: 'unique_attendee_email',
          type: 'unique',
          fieldId: toFieldId('fld_att_email'),
        },
      ],
    },
    {
      id: toEntityId('ent_venue'),
      key: 'venue',
      label: 'Venue',
      pluralLabel: 'Venues',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_ven_name'),
          key: 'name',
          label: 'Venue Name',
          type: 'text',
          required: true,
          queryable: { searchable: true },
        },
        {
          id: toFieldId('fld_ven_address'),
          key: 'address',
          label: 'Address',
          type: 'textarea',
          required: true,
        },
        {
          id: toFieldId('fld_ven_capacity'),
          key: 'maxCapacity',
          label: 'Maximum Capacity',
          type: 'number',
          config: { integer: true },
        },
      ],
    },
    {
      id: toEntityId('ent_event'),
      key: 'event',
      label: 'Event',
      pluralLabel: 'Events',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_evt_title'),
          key: 'title',
          label: 'Event Title',
          type: 'text',
          required: true,
          queryable: { searchable: true, sortable: true },
        },
        {
          id: toFieldId('fld_evt_slug'),
          key: 'slug',
          label: 'URL Slug',
          type: 'slug',
          required: true,
          config: { sourceFieldId: toFieldId('fld_evt_title') },
        },
        {
          id: toFieldId('fld_evt_desc'),
          key: 'description',
          label: 'Description',
          type: 'richText',
        },
        {
          id: toFieldId('fld_evt_start'),
          key: 'startDate',
          label: 'Start Date & Time',
          type: 'datetime',
          required: true,
          queryable: { filterable: true, sortable: true },
        },
        {
          id: toFieldId('fld_evt_end'),
          key: 'endDate',
          label: 'End Date & Time',
          type: 'datetime',
          required: true,
        },
        {
          id: toFieldId('fld_evt_venue'),
          key: 'venueId',
          label: 'Venue',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_venue'),
            onDelete: 'restrict',
          },
          queryable: { filterable: true },
        },
      ],
      constraints: [
        {
          id: toConstraintId('cst_evt_slug_unique'),
          key: 'unique_event_slug',
          type: 'unique',
          fieldId: toFieldId('fld_evt_slug'),
        },
      ],
    },
    {
      id: toEntityId('ent_speaker'),
      key: 'speaker',
      label: 'Speaker',
      pluralLabel: 'Speakers',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_spk_event'),
          key: 'eventId',
          label: 'Event',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_event'),
            onDelete: 'cascade',
          },
        },
        {
          id: toFieldId('fld_spk_name'),
          key: 'name',
          label: 'Speaker Name',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_spk_topic'),
          key: 'topic',
          label: 'Presentation Topic',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_spk_bio'),
          key: 'bio',
          label: 'Bio',
          type: 'textarea',
        },
      ],
    },
    {
      id: toEntityId('ent_ticket_type'),
      key: 'ticketType',
      label: 'Ticket Type',
      pluralLabel: 'Ticket Types',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_tkt_event'),
          key: 'eventId',
          label: 'Event',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_event'),
            onDelete: 'cascade',
          },
        },
        {
          id: toFieldId('fld_tkt_name'),
          key: 'name',
          label: 'Ticket Name',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_tkt_price'),
          key: 'price',
          label: 'Price',
          type: 'money',
          required: true,
          config: { currencyCode: 'USD' },
        },
        {
          id: toFieldId('fld_tkt_capacity'),
          key: 'capacity',
          label: 'Available Tickets',
          type: 'number',
          required: true,
          config: { integer: true },
        },
      ],
    },
    {
      id: toEntityId('ent_registration'),
      key: 'registration',
      label: 'Registration',
      pluralLabel: 'Registrations',
      system: false,
      persist: true,
      ownership: {
        ownerFieldId: toFieldId('fld_reg_attendee'),
      },
      fields: [
        {
          id: toFieldId('fld_reg_attendee'),
          key: 'attendeeId',
          label: 'Attendee',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_attendee'),
            onDelete: 'cascade',
          },
          queryable: { filterable: true },
        },
        {
          id: toFieldId('fld_reg_ticket'),
          key: 'ticketTypeId',
          label: 'Ticket Type',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_ticket_type'),
            onDelete: 'restrict',
          },
          queryable: { filterable: true },
        },
        {
          id: toFieldId('fld_reg_status'),
          key: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
            ],
            defaultValue: 'confirmed',
          },
        },
      ],
      constraints: [
        {
          id: toConstraintId('cst_reg_unique'),
          key: 'unique_attendee_ticket',
          type: 'compositeUnique',
          fieldIds: [toFieldId('fld_reg_attendee'), toFieldId('fld_reg_ticket')],
        },
      ],
    },
  ],
  access: {
    policies: [
      {
        id: toPolicyId('pol_evt_read'),
        subject: 'anonymous',
        entityId: toEntityId('ent_event'),
        operations: ['read'],
        scope: 'public',
      },
      {
        id: toPolicyId('pol_reg_own'),
        subject: toRoleId('role_attendee'),
        entityId: toEntityId('ent_registration'),
        operations: ['create', 'read'],
        scope: 'own',
      },
    ],
  },
  navigation: {
    menus: [
      {
        id: toMenuId('menu_evt_main'),
        key: 'evt_main_menu',
        label: 'Main Navigation',
        items: [
          {
            id: toMenuItemId('item_evt_home'),
            label: 'Events',
            path: '/events',
            pageId: toPageId('page_events'),
          },
        ],
      },
    ],
  },
  layouts: [
    {
      id: toLayoutId('layout_evt_default'),
      key: 'evt_default_layout',
      label: 'Event Layout',
      regions: [
        {
          name: 'header',
          blocks: [
            {
              id: toBlockId('blk_evt_nav'),
              type: 'Navbar',
              props: {
                brandTitle: 'SummitFlow',
                logoAssetId: toAssetId('asset_evt_logo'),
                menuId: toMenuId('menu_evt_main'),
              },
            },
          ],
        },
      ],
    },
  ],
  pages: [
    {
      id: toPageId('page_events'),
      key: 'events_list',
      route: '/events',
      title: 'Upcoming Events',
      layoutId: toLayoutId('layout_evt_default'),
      blocks: [
        {
          id: toBlockId('blk_events_grid'),
          type: 'EntityList',
          props: {
            entityId: toEntityId('ent_event'),
            view: 'cards',
            sortField: toFieldId('fld_evt_start'),
            sortDirection: 'asc',
          },
        },
      ],
    },
    {
      id: toPageId('page_event_detail'),
      key: 'event_detail',
      route: '/events/:eventId',
      title: 'Event Details',
      layoutId: toLayoutId('layout_evt_default'),
      blocks: [
        {
          id: toBlockId('blk_evt_details'),
          type: 'EntityDetails',
          props: {
            entityId: toEntityId('ent_event'),
            fields: [
              toFieldId('fld_evt_title'),
              toFieldId('fld_evt_desc'),
              toFieldId('fld_evt_start'),
              toFieldId('fld_evt_end'),
            ],
          },
        },
      ],
    },
  ],
  rules: [
    {
      id: toRuleId('rule_reg_limit'),
      key: 'ticket_capacity_limit',
      label: 'Ticket Capacity Limit',
      kind: 'capacityLimit',
      entityId: toEntityId('ent_registration'),
      limit: 500,
      errorMessage: 'This ticket type is sold out.',
    },
  ],
  theme: {
    colorModes: 'light',
    colors: {
      primary: '#09090b',
      primaryForeground: '#fafafa',
      secondary: '#f4f4f5',
      secondaryForeground: '#18181b',
      surface: '#ffffff',
      surfaceForeground: '#09090b',
      background: '#fafafa',
      text: '#09090b',
      muted: '#71717a',
      mutedForeground: '#a1a1aa',
      border: '#e4e4e7',
      accent: '#f97316',
      accentForeground: '#ffffff',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    typography: {
      fontFamily: {
        heading: 'Cabinet Grotesk',
        body: 'Inter',
      },
    },
  },
  integrations: [],
};
