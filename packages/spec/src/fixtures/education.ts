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

export const educationFixture: AppSpec = {
  schemaVersion: '1.0.0',
  metadata: {
    id: toAppSpecId('app_education_v1'),
    name: 'Academy Hub',
    description: 'Online learning and course enrollment platform',
    origin: 'education-starter',
  },
  settings: {
    locale: 'en-US',
    timezone: 'UTC',
    currency: 'USD',
    brand: {
      name: 'Academy Hub',
      logoAssetId: toAssetId('asset_edu_logo'),
      tagline: 'Master skills with expert-led courses',
    },
    defaultSEO: {
      title: 'Academy Hub | Modern Online Learning',
      description: 'Explore interactive courses taught by industry veterans.',
    },
  },
  assets: [
    {
      id: toAssetId('asset_edu_logo'),
      key: 'academy_logo',
      kind: 'image',
      mimeType: 'image/svg+xml',
      alt: 'Academy Hub Logo',
      visibility: 'public',
    },
  ],
  auth: {
    methods: ['password', 'magic-link'],
    signup: {
      enabled: true,
      defaultRoleId: toRoleId('role_student'),
    },
    roles: [
      {
        id: toRoleId('role_student'),
        key: 'student',
        label: 'Student',
      },
      {
        id: toRoleId('role_instructor'),
        key: 'instructor',
        label: 'Instructor',
      },
      {
        id: toRoleId('role_admin'),
        key: 'admin',
        label: 'Administrator',
      },
    ],
    userEntityId: toEntityId('ent_student'),
  },
  entities: [
    {
      id: toEntityId('ent_student'),
      key: 'student',
      label: 'Student',
      pluralLabel: 'Students',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_stu_email'),
          key: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          queryable: { filterable: true, searchable: true },
        },
        {
          id: toFieldId('fld_stu_name'),
          key: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          queryable: { searchable: true },
        },
      ],
      constraints: [
        {
          id: toConstraintId('cst_stu_email_unique'),
          key: 'unique_student_email',
          type: 'unique',
          fieldId: toFieldId('fld_stu_email'),
        },
      ],
    },
    {
      id: toEntityId('ent_instructor'),
      key: 'instructor',
      label: 'Instructor',
      pluralLabel: 'Instructors',
      system: false,
      persist: true,
      ownership: {
        ownerFieldId: toFieldId('fld_inst_user'),
      },
      fields: [
        {
          id: toFieldId('fld_inst_name'),
          key: 'name',
          label: 'Instructor Name',
          type: 'text',
          required: true,
          queryable: { searchable: true },
        },
        {
          id: toFieldId('fld_inst_title'),
          key: 'title',
          label: 'Professional Title',
          type: 'text',
        },
        {
          id: toFieldId('fld_inst_bio'),
          key: 'bio',
          label: 'Biography',
          type: 'textarea',
        },
        {
          id: toFieldId('fld_inst_user'),
          key: 'studentId',
          label: 'User Account',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_student'),
            onDelete: 'cascade',
          },
        },
      ],
    },
    {
      id: toEntityId('ent_course'),
      key: 'course',
      label: 'Course',
      pluralLabel: 'Courses',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_crs_title'),
          key: 'title',
          label: 'Course Title',
          type: 'text',
          required: true,
          queryable: { searchable: true, sortable: true },
        },
        {
          id: toFieldId('fld_crs_slug'),
          key: 'slug',
          label: 'URL Slug',
          type: 'slug',
          required: true,
          config: { sourceFieldId: toFieldId('fld_crs_title') },
        },
        {
          id: toFieldId('fld_crs_summary'),
          key: 'summary',
          label: 'Summary',
          type: 'textarea',
          required: true,
        },
        {
          id: toFieldId('fld_crs_instructor'),
          key: 'instructorId',
          label: 'Instructor',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_instructor'),
            onDelete: 'restrict',
          },
          queryable: { filterable: true },
        },
        {
          id: toFieldId('fld_crs_price'),
          key: 'price',
          label: 'Price',
          type: 'money',
          required: true,
          config: { currencyCode: 'USD' },
          queryable: { filterable: true, sortable: true },
        },
        {
          id: toFieldId('fld_crs_level'),
          key: 'level',
          label: 'Difficulty Level',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ],
            defaultValue: 'beginner',
          },
          queryable: { filterable: true },
        },
      ],
      constraints: [
        {
          id: toConstraintId('cst_crs_slug_unique'),
          key: 'unique_course_slug',
          type: 'unique',
          fieldId: toFieldId('fld_crs_slug'),
        },
      ],
    },
    {
      id: toEntityId('ent_module'),
      key: 'module',
      label: 'Module',
      pluralLabel: 'Modules',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_mod_course'),
          key: 'courseId',
          label: 'Course',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_course'),
            onDelete: 'cascade',
          },
        },
        {
          id: toFieldId('fld_mod_title'),
          key: 'title',
          label: 'Module Title',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_mod_order'),
          key: 'order',
          label: 'Display Order',
          type: 'number',
          required: true,
          config: { integer: true },
        },
      ],
    },
    {
      id: toEntityId('ent_lesson'),
      key: 'lesson',
      label: 'Lesson',
      pluralLabel: 'Lessons',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_les_module'),
          key: 'moduleId',
          label: 'Module',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_module'),
            onDelete: 'cascade',
          },
        },
        {
          id: toFieldId('fld_les_title'),
          key: 'title',
          label: 'Lesson Title',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_les_content'),
          key: 'content',
          label: 'Lesson Content',
          type: 'richText',
        },
        {
          id: toFieldId('fld_les_duration'),
          key: 'durationMinutes',
          label: 'Duration in Minutes',
          type: 'number',
          config: { integer: true },
        },
      ],
    },
    {
      id: toEntityId('ent_enrollment'),
      key: 'enrollment',
      label: 'Enrollment',
      pluralLabel: 'Enrollments',
      system: false,
      persist: true,
      ownership: {
        ownerFieldId: toFieldId('fld_enr_student'),
      },
      fields: [
        {
          id: toFieldId('fld_enr_student'),
          key: 'studentId',
          label: 'Student',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_student'),
            onDelete: 'cascade',
          },
          queryable: { filterable: true },
        },
        {
          id: toFieldId('fld_enr_course'),
          key: 'courseId',
          label: 'Course',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_course'),
            onDelete: 'restrict',
          },
          queryable: { filterable: true },
        },
        {
          id: toFieldId('fld_enr_status'),
          key: 'status',
          label: 'Enrollment Status',
          type: 'select',
          required: true,
          config: {
            options: [
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ],
            defaultValue: 'active',
          },
        },
      ],
      constraints: [
        {
          id: toConstraintId('cst_enrollment_unique'),
          key: 'unique_student_course_enrollment',
          type: 'compositeUnique',
          fieldIds: [toFieldId('fld_enr_student'), toFieldId('fld_enr_course')],
        },
      ],
    },
    {
      id: toEntityId('ent_assignment'),
      key: 'assignment',
      label: 'Assignment',
      pluralLabel: 'Assignments',
      system: false,
      persist: true,
      fields: [
        {
          id: toFieldId('fld_asg_course'),
          key: 'courseId',
          label: 'Course',
          type: 'reference',
          required: true,
          config: {
            targetEntityId: toEntityId('ent_course'),
            onDelete: 'cascade',
          },
        },
        {
          id: toFieldId('fld_asg_title'),
          key: 'title',
          label: 'Assignment Title',
          type: 'text',
          required: true,
        },
        {
          id: toFieldId('fld_asg_instructions'),
          key: 'instructions',
          label: 'Instructions',
          type: 'textarea',
          required: true,
        },
        {
          id: toFieldId('fld_asg_duedate'),
          key: 'dueDate',
          label: 'Due Date',
          type: 'date',
        },
      ],
    },
  ],
  access: {
    policies: [
      {
        id: toPolicyId('pol_edu_crs_read'),
        subject: 'anonymous',
        entityId: toEntityId('ent_course'),
        operations: ['read'],
        scope: 'public',
      },
      {
        id: toPolicyId('pol_edu_enr_own'),
        subject: toRoleId('role_student'),
        entityId: toEntityId('ent_enrollment'),
        operations: ['create', 'read'],
        scope: 'own',
      },
      {
        id: toPolicyId('pol_edu_inst_own'),
        subject: toRoleId('role_instructor'),
        entityId: toEntityId('ent_instructor'),
        operations: ['read', 'update'],
        scope: 'own',
      },
    ],
  },
  navigation: {
    menus: [
      {
        id: toMenuId('menu_edu_main'),
        key: 'edu_main_menu',
        label: 'Main Navigation',
        items: [
          {
            id: toMenuItemId('item_edu_courses'),
            label: 'Courses',
            path: '/courses',
            pageId: toPageId('page_courses'),
          },
        ],
      },
    ],
  },
  layouts: [
    {
      id: toLayoutId('layout_edu_default'),
      key: 'edu_default_layout',
      label: 'Academy Layout',
      regions: [
        {
          name: 'header',
          blocks: [
            {
              id: toBlockId('blk_edu_nav'),
              type: 'Navbar',
              props: {
                brandTitle: 'Academy Hub',
                logoAssetId: toAssetId('asset_edu_logo'),
                menuId: toMenuId('menu_edu_main'),
              },
            },
          ],
        },
      ],
    },
  ],
  pages: [
    {
      id: toPageId('page_courses'),
      key: 'courses_list',
      route: '/courses',
      title: 'Explore Courses',
      layoutId: toLayoutId('layout_edu_default'),
      blocks: [
        {
          id: toBlockId('blk_courses_list'),
          type: 'EntityList',
          props: {
            entityId: toEntityId('ent_course'),
            view: 'cards',
            filterFields: [toFieldId('fld_crs_level')],
            sortField: toFieldId('fld_crs_price'),
          },
        },
      ],
    },
    {
      id: toPageId('page_course_details'),
      key: 'course_details',
      route: '/courses/:courseId',
      title: 'Course Details',
      layoutId: toLayoutId('layout_edu_default'),
      blocks: [
        {
          id: toBlockId('blk_crs_details'),
          type: 'EntityDetails',
          props: {
            entityId: toEntityId('ent_course'),
            fields: [
              toFieldId('fld_crs_title'),
              toFieldId('fld_crs_summary'),
              toFieldId('fld_crs_price'),
              toFieldId('fld_crs_level'),
            ],
          },
        },
      ],
    },
  ],
  rules: [
    {
      id: toRuleId('rule_enrollment_notify'),
      key: 'notify_student_enrolled',
      label: 'Notify on Enrollment',
      kind: 'notify',
      triggerEntityId: toEntityId('ent_enrollment'),
      triggerEvent: 'create',
      channel: 'email',
      recipient: 'owner',
      template: 'enrollment_welcome_v1',
    },
  ],
  theme: {
    colorModes: 'light',
    colors: {
      primary: '#4f46e5',
      primaryForeground: '#ffffff',
      secondary: '#e0e7ff',
      secondaryForeground: '#312e81',
      surface: '#ffffff',
      surfaceForeground: '#1e1b4b',
      background: '#f8fafc',
      text: '#1e293b',
      muted: '#64748b',
      mutedForeground: '#94a3b8',
      border: '#e2e8f0',
      accent: '#06b6d4',
      accentForeground: '#ffffff',
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
    },
    typography: {
      fontFamily: {
        heading: 'Plus Jakarta Sans',
        body: 'Inter',
      },
    },
  },
  integrations: [],
};
