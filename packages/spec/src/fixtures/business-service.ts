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
  toMenuId,
  toMenuItemId,
  toPolicyId,
} from '../identity.js';

export const businessServiceFixture: AppSpec = {
  schemaVersion: '1.0.0',
  metadata: {
    id: toAppSpecId('app_business_v1'),
    name: 'Vanguard Strategy Consulting',
    description: 'B2B management consulting and advisory services',
    origin: 'business-starter',
  },
  settings: {
    locale: 'en-US',
    timezone: 'America/New_York',
    currency: 'USD',
    brand: {
      name: 'Vanguard Strategy',
      logoAssetId: toAssetId('asset_vanguard_logo'),
      tagline: 'Strategic clarity for global leaders',
    },
    defaultSEO: {
      title: 'Vanguard Strategy | Management Consulting',
      description: 'Accelerating enterprise growth through strategic advisory.',
    },
  },
  assets: [
    {
      id: toAssetId('asset_vanguard_logo'),
      key: 'vanguard_logo',
      kind: 'image',
      mimeType: 'image/svg+xml',
      alt: 'Vanguard Strategy Logo',
      visibility: 'public',
    },
    {
      id: toAssetId('asset_consulting_hero'),
      key: 'consulting_hero',
      kind: 'image',
      mimeType: 'image/jpeg',
      alt: 'Corporate Advisory Session',
      visibility: 'public',
    },
  ],
  entities: [
    {
      id: toEntityId('ent_service_offering'),
      key: 'serviceOffering',
      label: 'Service Offering',
      pluralLabel: 'Service Offerings',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_svc_title'),
          key: 'title',
          label: 'Service Title',
          type: 'text',
          required: true,
          queryable: { searchable: true },
        },
        {
          id: toFieldId('fld_svc_slug'),
          key: 'slug',
          label: 'URL Slug',
          type: 'slug',
          required: true,
          config: { sourceFieldId: toFieldId('fld_svc_title') },
        },
        {
          id: toFieldId('fld_svc_summary'),
          key: 'summary',
          label: 'Executive Summary',
          type: 'textarea',
          required: true,
        },
        {
          id: toFieldId('fld_svc_desc'),
          key: 'description',
          label: 'Detailed Capabilities',
          type: 'richText',
        },
      ],
      constraints: [
        {
          id: toConstraintId('cst_svc_slug_unique'),
          key: 'unique_service_offering_slug',
          type: 'unique',
          fieldId: toFieldId('fld_svc_slug'),
        },
      ],
    },
    {
      id: toEntityId('ent_team_member'),
      key: 'teamMember',
      label: 'Team Member',
      pluralLabel: 'Team Members',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_tm_name'),
          key: 'name',
          label: 'Partner Name',
          type: 'text',
          required: true,
          queryable: { searchable: true },
        },
        {
          id: toFieldId('fld_tm_role'),
          key: 'role',
          label: 'Practice Leadership Role',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_tm_bio'),
          key: 'bio',
          label: 'Biography',
          type: 'textarea',
        },
      ],
    },
    {
      id: toEntityId('ent_case_study'),
      key: 'caseStudy',
      label: 'Case Study',
      pluralLabel: 'Case Studies',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_cs_title'),
          key: 'title',
          label: 'Case Study Title',
          type: 'text',
          required: true,
          queryable: { searchable: true },
        },
        {
          id: toFieldId('fld_cs_slug'),
          key: 'slug',
          label: 'URL Slug',
          type: 'slug',
          required: true,
          config: { sourceFieldId: toFieldId('fld_cs_title') },
        },
        {
          id: toFieldId('fld_cs_client'),
          key: 'clientIndustry',
          label: 'Client Industry',
          type: 'text',
        },
        {
          id: toFieldId('fld_cs_impact'),
          key: 'impactSummary',
          label: 'Measurable Impact',
          type: 'textarea',
          required: true,
        },
      ],
      constraints: [
        {
          id: toConstraintId('cst_cs_slug_unique'),
          key: 'unique_case_study_slug',
          type: 'unique',
          fieldId: toFieldId('fld_cs_slug'),
        },
      ],
    },
    {
      id: toEntityId('ent_testimonial'),
      key: 'testimonial',
      label: 'Testimonial',
      pluralLabel: 'Testimonials',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_tst_author'),
          key: 'authorName',
          label: 'Author Name',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_tst_company'),
          key: 'company',
          label: 'Company',
          type: 'text',
        },
        {
          id: toFieldId('fld_tst_quote'),
          key: 'quote',
          label: 'Quote',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      id: toEntityId('ent_contact_submission'),
      key: 'contactSubmission',
      label: 'Contact Submission',
      pluralLabel: 'Contact Submissions',
      system: false,
      persist: false, // Non-persisted form definition for contact inquiries
      fields: [
        {
          id: toFieldId('fld_cnt_name'),
          key: 'senderName',
          label: 'Your Name',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_cnt_email'),
          key: 'senderEmail',
          label: 'Business Email',
          type: 'email',
          required: true,
        },
        {
          id: toFieldId('fld_cnt_subject'),
          key: 'inquirySubject',
          label: 'Inquiry Subject',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_cnt_message'),
          key: 'message',
          label: 'Project Details & Message',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
  access: {
    policies: [
      {
        id: toPolicyId('pol_biz_svc_read'),
        subject: 'anonymous',
        entityId: toEntityId('ent_service_offering'),
        operations: ['read'],
        scope: 'public',
      },
      {
        id: toPolicyId('pol_biz_team_read'),
        subject: 'anonymous',
        entityId: toEntityId('ent_team_member'),
        operations: ['read'],
        scope: 'public',
      },
      {
        id: toPolicyId('pol_biz_case_read'),
        subject: 'anonymous',
        entityId: toEntityId('ent_case_study'),
        operations: ['read'],
        scope: 'public',
      },
      {
        id: toPolicyId('pol_biz_test_read'),
        subject: 'anonymous',
        entityId: toEntityId('ent_testimonial'),
        operations: ['read'],
        scope: 'public',
      },
      {
        id: toPolicyId('pol_biz_contact_create'),
        subject: 'anonymous',
        entityId: toEntityId('ent_contact_submission'),
        operations: ['create'],
        scope: 'public',
      },
    ],
  },
  navigation: {
    menus: [
      {
        id: toMenuId('menu_biz_main'),
        key: 'biz_main_menu',
        label: 'Main Navigation',
        items: [
          {
            id: toMenuItemId('item_biz_home'),
            label: 'Home',
            path: '/',
            pageId: toPageId('page_biz_home'),
          },
          {
            id: toMenuItemId('item_biz_contact'),
            label: 'Contact',
            path: '/contact',
            pageId: toPageId('page_biz_contact'),
          },
        ],
      },
    ],
  },
  layouts: [
    {
      id: toLayoutId('layout_biz_default'),
      key: 'biz_default_layout',
      label: 'Corporate Layout',
      regions: [
        {
          name: 'header',
          blocks: [
            {
              id: toBlockId('blk_biz_nav'),
              type: 'Navbar',
              props: {
                brandTitle: 'Vanguard Strategy',
                logoAssetId: toAssetId('asset_vanguard_logo'),
                menuId: toMenuId('menu_biz_main'),
              },
            },
          ],
        },
      ],
    },
  ],
  pages: [
    {
      id: toPageId('page_biz_home'),
      key: 'home',
      route: '/',
      title: 'Advisory & Strategy Consulting',
      layoutId: toLayoutId('layout_biz_default'),
      blocks: [
        {
          id: toBlockId('blk_biz_hero'),
          type: 'Hero',
          props: {
            heading: 'Clarity in Transformation',
            subheading: 'Guiding global enterprises through high-stakes market evolution.',
            ctaLabel: 'Engage Our Team',
            imageAssetId: toAssetId('asset_consulting_hero'),
            ctaAction: {
              type: 'Navigate',
              target: '/contact',
            },
          },
        },
        {
          id: toBlockId('blk_biz_services'),
          type: 'EntityList',
          props: {
            entityId: toEntityId('ent_service_offering'),
            view: 'cards',
          },
        },
        {
          id: toBlockId('blk_biz_faq'),
          type: 'FAQ',
          props: {
            items: [
              {
                question: 'How do you engage with clients?',
                answer:
                  'We deploy cross-functional teams of partners and subject specialists for fixed-scope strategic initiatives.',
              },
              {
                question: 'What industries do you specialize in?',
                answer:
                  'Our core practices span Financial Services, Technology, Energy, and Healthcare.',
              },
            ],
          },
        },
      ],
    },
    {
      id: toPageId('page_biz_contact'),
      key: 'contact',
      route: '/contact',
      title: 'Contact Our Partners',
      layoutId: toLayoutId('layout_biz_default'),
      blocks: [
        {
          id: toBlockId('blk_contact_form'),
          type: 'EntityForm',
          props: {
            entityId: toEntityId('ent_contact_submission'),
            mode: 'create',
            submitAction: {
              type: 'ShowMessage',
              message: 'Thank you. A senior partner will contact you within 24 business hours.',
              level: 'success',
            },
          },
        },
      ],
    },
  ],
  rules: [
    {
      id: toRuleId('rule_contact_notification'),
      key: 'notify_partner_contact_inquiry',
      label: 'Notify Partners on Inquiry',
      kind: 'notify',
      triggerEntityId: toEntityId('ent_contact_submission'),
      triggerEvent: 'create',
      channel: 'email',
      recipient: 'admin',
      template: 'new_client_inquiry_email',
    },
  ],
  theme: {
    colorModes: 'light',
    colors: {
      primary: '#0f172a',
      primaryForeground: '#ffffff',
      secondary: '#f8fafc',
      secondaryForeground: '#0f172a',
      surface: '#ffffff',
      surfaceForeground: '#0f172a',
      background: '#ffffff',
      text: '#334155',
      muted: '#64748b',
      mutedForeground: '#94a3b8',
      border: '#e2e8f0',
      accent: '#0284c7',
      accentForeground: '#ffffff',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    typography: {
      fontFamily: {
        heading: 'Cinzel',
        body: 'Inter',
      },
    },
  },
  integrations: [],
};
