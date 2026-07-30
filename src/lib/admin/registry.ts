import type { CollectionName } from '@/types/pb';

/**
 * Declarative description of every collection the admin can edit.
 *
 * One registry drives the list views, the forms, the Zod schemas and the
 * Server Actions, so adding a field is a one-line change here rather than an
 * edit across four files. Translatable fields are declared once by their base
 * name — `title` expands to `title_en` / `title_ar` / `title_ku`.
 *
 * Field labels are English because this surface is staff-facing; the
 * surrounding chrome is translated through next-intl.
 */

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'editor'
  | 'number'
  | 'bool'
  | 'email'
  | 'url'
  | 'date'
  | 'select'
  | 'relation'
  | 'file';

export interface FieldDef {
  /** Base name. When `translatable`, the stored fields are `${name}_en|_ar|_ku`. */
  name: string;
  label: string;
  kind: FieldKind;
  translatable?: boolean;
  required?: boolean;
  help?: string;
  /** `select` only. */
  options?: readonly string[];
  /** `relation` only. */
  relation?: { collection: CollectionName; multiple?: boolean };
  /** `file` only — accept attribute for the input. */
  accept?: string;
  /** `number` only. */
  min?: number;
  max?: number;
  /** Hidden on the create form (e.g. server-assigned). */
  readOnly?: boolean;
}

export type ColumnKind = 'text' | 'bool' | 'badge' | 'relation' | 'date' | 'number' | 'translations';

export interface ColumnDef {
  name: string;
  label: string;
  kind: ColumnKind;
  translatable?: boolean;
  /** `translations` only — the base fields whose completeness is summarised. */
  fields?: readonly string[];
  relationLabel?: string;
}

export interface CollectionDef {
  name: CollectionName;
  label: string;
  labelPlural: string;
  group: 'Content' | 'Directory' | 'Site' | 'People' | 'Inbox';
  /** Only `admin` may open this section; moderators get a 404. */
  adminOnly?: boolean;
  canCreate?: boolean;
  /** PocketBase restricts deletes to admins on most collections. */
  canDelete?: boolean;
  /** Used for the row title and the record heading. */
  titleField: string;
  titleTranslatable?: boolean;
  searchFields: readonly string[];
  defaultSort: string;
  listColumns: readonly ColumnDef[];
  fields: readonly FieldDef[];
  /** Relations to expand when listing, so relation columns can render a label. */
  expand?: string;
  description?: string;
}

const SORT: FieldDef = {
  name: 'sort_order',
  label: 'Sort order',
  kind: 'number',
  help: 'Lower numbers appear first.',
};
const ENABLED: FieldDef = { name: 'enabled', label: 'Published', kind: 'bool' };
const ARCHIVED: FieldDef = {
  name: 'archived',
  label: 'Archived',
  kind: 'bool',
  help: 'Archived records are hidden from the public site but kept for reference.',
};

const GPS: FieldDef[] = [
  { name: 'gps_lat', label: 'Latitude', kind: 'number' },
  { name: 'gps_lon', label: 'Longitude', kind: 'number' },
];

const CONTACT_FIELDS: FieldDef[] = [
  { name: 'website', label: 'Website', kind: 'url' },
  { name: 'phone', label: 'Phone', kind: 'text' },
  { name: 'email', label: 'Email', kind: 'email' },
];

export const collections: readonly CollectionDef[] = [
  // ---------------------------------------------------------------- Content
  {
    name: 'procedures',
    label: 'Procedure',
    labelPlural: 'Procedures',
    group: 'Content',
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    titleTranslatable: true,
    searchFields: ['title_en', 'title_ar', 'title_ku', 'slug'],
    defaultSort: 'sort_order',
    expand: 'directorate',
    description: 'The step-by-step guides citizens come to the site for.',
    listColumns: [
      { name: 'title', label: 'Title', kind: 'text', translatable: true },
      { name: 'directorate', label: 'Directorate', kind: 'relation', relationLabel: 'title_en' },
      {
        name: 'translations',
        label: 'Languages',
        kind: 'translations',
        fields: ['title', 'summary', 'description'],
      },
      { name: 'enabled', label: 'Published', kind: 'bool' },
      { name: 'featured', label: 'Featured', kind: 'bool' },
      { name: 'archived', label: 'Archived', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', translatable: true, required: true },
      {
        name: 'slug',
        label: 'Slug',
        kind: 'text',
        required: true,
        help: 'Lowercase words separated by hyphens. Used in the public URL — changing it breaks existing links.',
      },
      {
        name: 'directorate',
        label: 'Directorate',
        kind: 'relation',
        required: true,
        relation: { collection: 'directorates' },
      },
      { name: 'tags', label: 'Tags', kind: 'relation', relation: { collection: 'tags', multiple: true } },
      { name: 'summary', label: 'Summary', kind: 'textarea', translatable: true },
      { name: 'description', label: 'Description', kind: 'editor', translatable: true },
      { name: 'fee_iqd', label: 'Fee (IQD)', kind: 'number', min: 0, help: 'Main government fee. Use 0 when the service is free.' },
      { name: 'processing_time', label: 'Processing time', kind: 'text', translatable: true },
      { name: 'publish_date', label: 'Publish date', kind: 'date' },
      ENABLED,
      { name: 'featured', label: 'Featured on home', kind: 'bool' },
      SORT,
      ARCHIVED,
    ],
  },
  {
    name: 'procedure_items',
    label: 'Procedure step',
    labelPlural: 'Procedure steps',
    group: 'Content',
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    titleTranslatable: true,
    searchFields: ['title_en', 'title_ar', 'title_ku'],
    defaultSort: 'procedure,sort_order',
    expand: 'procedure',
    description: 'Ordered steps within a procedure.',
    listColumns: [
      { name: 'title', label: 'Step', kind: 'text', translatable: true },
      { name: 'procedure', label: 'Procedure', kind: 'relation', relationLabel: 'title_en' },
      { name: 'sort_order', label: 'Order', kind: 'number' },
      { name: 'translations', label: 'Languages', kind: 'translations', fields: ['title', 'description'] },
      { name: 'enabled', label: 'Published', kind: 'bool' },
    ],
    fields: [
      {
        name: 'procedure',
        label: 'Procedure',
        kind: 'relation',
        required: true,
        relation: { collection: 'procedures' },
      },
      { name: 'title', label: 'Step title', kind: 'text', translatable: true, required: true },
      { name: 'description', label: 'Description', kind: 'editor', translatable: true },
      { name: 'url', label: 'External link', kind: 'url' },
      SORT,
      ENABLED,
    ],
  },
  {
    name: 'files',
    label: 'Form',
    labelPlural: 'Forms & documents',
    group: 'Content',
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    titleTranslatable: true,
    searchFields: ['title_en', 'title_ar', 'title_ku'],
    defaultSort: 'sort_order',
    expand: 'procedure',
    description: 'Downloadable forms attached to a procedure or one of its steps.',
    listColumns: [
      { name: 'title', label: 'Title', kind: 'text', translatable: true },
      { name: 'procedure', label: 'Procedure', kind: 'relation', relationLabel: 'title_en' },
      { name: 'document', label: 'File', kind: 'text' },
      { name: 'sort_order', label: 'Order', kind: 'number' },
    ],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', translatable: true, required: true },
      {
        name: 'document',
        label: 'Document',
        kind: 'file',
        accept: '.pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png',
        help: 'Leave empty to keep the current file.',
      },
      {
        name: 'external_url',
        label: 'External URL',
        kind: 'url',
        help: 'Use when the directorate hosts the form itself rather than supplying it to us.',
      },
      { name: 'procedure', label: 'Procedure', kind: 'relation', relation: { collection: 'procedures' } },
      {
        name: 'procedure_item',
        label: 'Procedure step',
        kind: 'relation',
        relation: { collection: 'procedure_items' },
        help: 'Attach to either a procedure or a single step — not both.',
      },
      SORT,
    ],
  },
  {
    name: 'tags',
    label: 'Tag',
    labelPlural: 'Tags',
    group: 'Content',
    canCreate: true,
    canDelete: true,
    titleField: 'name',
    titleTranslatable: true,
    searchFields: ['name_en', 'name_ar', 'name_ku', 'slug'],
    defaultSort: 'name_en',
    listColumns: [
      { name: 'name', label: 'Name', kind: 'text', translatable: true },
      { name: 'slug', label: 'Slug', kind: 'text' },
      { name: 'translations', label: 'Languages', kind: 'translations', fields: ['name'] },
    ],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', translatable: true, required: true },
      { name: 'slug', label: 'Slug', kind: 'text', required: true },
    ],
  },

  // -------------------------------------------------------------- Directory
  {
    name: 'ministries',
    label: 'Ministry',
    labelPlural: 'Ministries',
    group: 'Directory',
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    titleTranslatable: true,
    searchFields: ['title_en', 'title_ar', 'title_ku', 'slug'],
    defaultSort: 'sort_order',
    listColumns: [
      { name: 'title', label: 'Ministry', kind: 'text', translatable: true },
      { name: 'krg', label: 'KRG', kind: 'bool' },
      { name: 'translations', label: 'Languages', kind: 'translations', fields: ['title', 'address'] },
      { name: 'archived', label: 'Archived', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Name', kind: 'text', translatable: true, required: true },
      { name: 'slug', label: 'Slug', kind: 'text', required: true },
      {
        name: 'krg',
        label: 'Kurdistan Regional Government',
        kind: 'bool',
        help: 'Flags bodies of the KRG rather than the federal government.',
      },
      { name: 'logo', label: 'Logo', kind: 'file', accept: 'image/*' },
      { name: 'address', label: 'Address', kind: 'textarea', translatable: true },
      ...GPS,
      ...CONTACT_FIELDS,
      SORT,
      ARCHIVED,
    ],
  },
  {
    name: 'directorates',
    label: 'Directorate',
    labelPlural: 'Directorates',
    group: 'Directory',
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    titleTranslatable: true,
    searchFields: ['title_en', 'title_ar', 'title_ku', 'slug'],
    defaultSort: 'sort_order',
    expand: 'ministry',
    listColumns: [
      { name: 'title', label: 'Directorate', kind: 'text', translatable: true },
      { name: 'ministry', label: 'Ministry', kind: 'relation', relationLabel: 'title_en' },
      {
        name: 'translations',
        label: 'Languages',
        kind: 'translations',
        fields: ['title', 'address', 'working_hours'],
      },
      { name: 'archived', label: 'Archived', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Name', kind: 'text', translatable: true, required: true },
      { name: 'slug', label: 'Slug', kind: 'text', required: true },
      {
        name: 'ministry',
        label: 'Ministry',
        kind: 'relation',
        required: true,
        relation: { collection: 'ministries' },
      },
      { name: 'logo', label: 'Logo', kind: 'file', accept: 'image/*' },
      { name: 'address', label: 'Address', kind: 'textarea', translatable: true },
      { name: 'working_hours', label: 'Working hours', kind: 'text', translatable: true },
      ...GPS,
      ...CONTACT_FIELDS,
      SORT,
      ARCHIVED,
    ],
  },
  {
    name: 'directorate_branches',
    label: 'Branch',
    labelPlural: 'Provincial branches',
    group: 'Directory',
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    titleTranslatable: true,
    searchFields: ['title_en', 'title_ar', 'title_ku'],
    defaultSort: 'sort_order',
    expand: 'directorate,province',
    listColumns: [
      { name: 'title', label: 'Branch', kind: 'text', translatable: true },
      { name: 'directorate', label: 'Directorate', kind: 'relation', relationLabel: 'title_en' },
      { name: 'province', label: 'Province', kind: 'relation', relationLabel: 'name_en' },
      { name: 'archived', label: 'Archived', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Name', kind: 'text', translatable: true, required: true },
      {
        name: 'directorate',
        label: 'Directorate',
        kind: 'relation',
        required: true,
        relation: { collection: 'directorates' },
      },
      {
        name: 'province',
        label: 'Province',
        kind: 'relation',
        required: true,
        relation: { collection: 'provinces' },
      },
      { name: 'address', label: 'Address', kind: 'textarea', translatable: true },
      ...GPS,
      { name: 'phone', label: 'Phone', kind: 'text' },
      SORT,
      ARCHIVED,
    ],
  },
  {
    name: 'provinces',
    label: 'Province',
    labelPlural: 'Provinces',
    group: 'Directory',
    adminOnly: true,
    canCreate: true,
    canDelete: true,
    titleField: 'name',
    titleTranslatable: true,
    searchFields: ['name_en', 'name_ar', 'name_ku', 'code'],
    defaultSort: 'sort_order',
    description: 'Reference geography. Only admins may change it.',
    listColumns: [
      { name: 'name', label: 'Province', kind: 'text', translatable: true },
      { name: 'code', label: 'Code', kind: 'text' },
      { name: 'krg', label: 'Kurdistan Region', kind: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', translatable: true, required: true },
      { name: 'code', label: 'ISO code', kind: 'text', required: true, help: 'For example IQ-BG.' },
      { name: 'krg', label: 'In the Kurdistan Region', kind: 'bool' },
      ...GPS,
      SORT,
    ],
  },

  // ------------------------------------------------------------------- Site
  {
    name: 'slider',
    label: 'Slide',
    labelPlural: 'Home slider',
    group: 'Site',
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    titleTranslatable: true,
    searchFields: ['title_en', 'title_ar', 'title_ku'],
    defaultSort: 'sort_order',
    listColumns: [
      { name: 'title', label: 'Slide', kind: 'text', translatable: true },
      { name: 'translations', label: 'Languages', kind: 'translations', fields: ['title', 'subtitle'] },
      { name: 'sort_order', label: 'Order', kind: 'number' },
      { name: 'enabled', label: 'Published', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Title', kind: 'text', translatable: true, required: true },
      { name: 'subtitle', label: 'Subtitle', kind: 'text', translatable: true },
      { name: 'image', label: 'Image', kind: 'file', accept: 'image/*' },
      { name: 'link', label: 'Link', kind: 'text', help: 'A path such as /en/procedures, or a full URL.' },
      SORT,
      ENABLED,
    ],
  },
  {
    name: 'faq',
    label: 'Question',
    labelPlural: 'FAQ',
    group: 'Site',
    canCreate: true,
    canDelete: true,
    titleField: 'question',
    titleTranslatable: true,
    searchFields: ['question_en', 'question_ar', 'question_ku'],
    defaultSort: 'sort_order',
    listColumns: [
      { name: 'question', label: 'Question', kind: 'text', translatable: true },
      { name: 'translations', label: 'Languages', kind: 'translations', fields: ['question', 'answer'] },
      { name: 'sort_order', label: 'Order', kind: 'number' },
      { name: 'enabled', label: 'Published', kind: 'bool' },
    ],
    fields: [
      { name: 'question', label: 'Question', kind: 'text', translatable: true, required: true },
      { name: 'answer', label: 'Answer', kind: 'editor', translatable: true },
      SORT,
      ENABLED,
    ],
  },
  {
    name: 'team',
    label: 'Team member',
    labelPlural: 'Team',
    group: 'Site',
    canCreate: true,
    canDelete: true,
    titleField: 'name',
    titleTranslatable: true,
    searchFields: ['name_en', 'name_ar', 'name_ku'],
    defaultSort: 'sort_order',
    listColumns: [
      { name: 'name', label: 'Name', kind: 'text', translatable: true },
      { name: 'location', label: 'Section', kind: 'badge' },
      { name: 'sort_order', label: 'Order', kind: 'number' },
      { name: 'enabled', label: 'Published', kind: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', translatable: true, required: true },
      { name: 'job_title', label: 'Job title', kind: 'text', translatable: true },
      { name: 'bio', label: 'Biography', kind: 'textarea', translatable: true },
      { name: 'photo', label: 'Photo', kind: 'file', accept: 'image/*' },
      { name: 'email', label: 'Email', kind: 'email' },
      {
        name: 'location',
        label: 'Section',
        kind: 'select',
        options: ['leadership', 'staff', 'advisory'],
      },
      SORT,
      ENABLED,
    ],
  },
  {
    name: 'partners',
    label: 'Partner',
    labelPlural: 'Partners',
    group: 'Site',
    canCreate: true,
    canDelete: true,
    titleField: 'name',
    titleTranslatable: true,
    searchFields: ['name_en', 'name_ar', 'name_ku'],
    defaultSort: 'sort_order',
    listColumns: [
      { name: 'name', label: 'Partner', kind: 'text', translatable: true },
      { name: 'location', label: 'Placement', kind: 'badge' },
      { name: 'sort_order', label: 'Order', kind: 'number' },
      { name: 'enabled', label: 'Published', kind: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Name', kind: 'text', translatable: true, required: true },
      { name: 'logo', label: 'Logo', kind: 'file', accept: 'image/*' },
      { name: 'link', label: 'Website', kind: 'url' },
      {
        name: 'location',
        label: 'Placement',
        kind: 'select',
        options: ['home', 'footer', 'partners_page'],
      },
      SORT,
      ENABLED,
    ],
  },
  {
    name: 'navigation',
    label: 'Menu item',
    labelPlural: 'Navigation',
    group: 'Site',
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    titleTranslatable: true,
    searchFields: ['title_en', 'title_ar', 'title_ku', 'endpoint'],
    defaultSort: 'placement,sort_order',
    expand: 'parent',
    listColumns: [
      { name: 'title', label: 'Label', kind: 'text', translatable: true },
      { name: 'placement', label: 'Placement', kind: 'badge' },
      { name: 'parent', label: 'Parent', kind: 'relation', relationLabel: 'title_en' },
      { name: 'endpoint', label: 'Path', kind: 'text' },
      { name: 'sort_order', label: 'Order', kind: 'number' },
      { name: 'enabled', label: 'Published', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Label', kind: 'text', translatable: true, required: true },
      { name: 'endpoint', label: 'Path', kind: 'text', help: 'For example /procedures.' },
      {
        name: 'placement',
        label: 'Placement',
        kind: 'select',
        required: true,
        options: ['menu', 'drawer'],
      },
      {
        name: 'parent',
        label: 'Parent item',
        kind: 'relation',
        relation: { collection: 'navigation' },
        help: 'Leave empty for a top-level item.',
      },
      { name: 'icon', label: 'Icon name', kind: 'text' },
      SORT,
      ENABLED,
    ],
  },
  {
    name: 'settings',
    label: 'Setting',
    labelPlural: 'Settings',
    group: 'Site',
    adminOnly: true,
    canCreate: true,
    canDelete: true,
    titleField: 'title',
    searchFields: ['key', 'title'],
    defaultSort: 'group,key',
    listColumns: [
      { name: 'title', label: 'Setting', kind: 'text' },
      { name: 'key', label: 'Key', kind: 'text' },
      { name: 'group', label: 'Group', kind: 'badge' },
      { name: 'no_trans', label: 'Not translated', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Label', kind: 'text', required: true },
      {
        name: 'key',
        label: 'Key',
        kind: 'text',
        required: true,
        help: 'Lowercase with underscores. The code reads settings by this key — renaming one breaks whatever reads it.',
      },
      {
        name: 'group',
        label: 'Group',
        kind: 'select',
        options: ['general', 'contact', 'social', 'seo'],
      },
      {
        name: 'no_trans',
        label: 'Same in every language',
        kind: 'bool',
        help: 'For values like a phone number or email address that are not translated.',
      },
      { name: 'value', label: 'Value', kind: 'textarea', translatable: true },
    ],
  },

  // ----------------------------------------------------------------- People
  {
    name: 'users',
    label: 'User',
    labelPlural: 'Users',
    group: 'People',
    adminOnly: true,
    canCreate: true,
    canDelete: true,
    titleField: 'full_name',
    searchFields: ['full_name', 'email'],
    defaultSort: 'full_name',
    description: 'Staff accounts and registered citizens.',
    listColumns: [
      { name: 'full_name', label: 'Name', kind: 'text' },
      { name: 'email', label: 'Email', kind: 'text' },
      { name: 'role', label: 'Role', kind: 'badge' },
      { name: 'job_title', label: 'Job title', kind: 'text' },
      { name: 'verified', label: 'Verified', kind: 'bool' },
    ],
    fields: [
      { name: 'full_name', label: 'Full name', kind: 'text', required: true },
      { name: 'email', label: 'Email', kind: 'email', required: true },
      { name: 'job_title', label: 'Job title', kind: 'text' },
      {
        name: 'role',
        label: 'Role',
        kind: 'select',
        required: true,
        options: ['user', 'moderator', 'admin'],
        help: 'Moderators manage content. Admins additionally manage users, settings, geography and deletions.',
      },
      { name: 'avatar', label: 'Avatar', kind: 'file', accept: 'image/*' },
      { name: 'verified', label: 'Email verified', kind: 'bool' },
    ],
  },

  // ------------------------------------------------------------------ Inbox
  {
    name: 'comments',
    label: 'Comment',
    labelPlural: 'Comments',
    group: 'Inbox',
    canCreate: false,
    canDelete: true,
    titleField: 'body',
    searchFields: ['body'],
    defaultSort: '-created',
    expand: 'author,procedure',
    description: 'Citizen comments awaiting moderation.',
    listColumns: [
      { name: 'body', label: 'Comment', kind: 'text' },
      { name: 'author', label: 'Author', kind: 'relation', relationLabel: 'full_name' },
      { name: 'procedure', label: 'Procedure', kind: 'relation', relationLabel: 'title_en' },
      { name: 'approved', label: 'Approved', kind: 'bool' },
      { name: 'created', label: 'Received', kind: 'date' },
    ],
    fields: [
      { name: 'body', label: 'Comment', kind: 'textarea', required: true },
      { name: 'approved', label: 'Approved', kind: 'bool' },
    ],
  },
  {
    name: 'reviews',
    label: 'Review',
    labelPlural: 'Reviews',
    group: 'Inbox',
    canCreate: false,
    canDelete: true,
    titleField: 'body',
    searchFields: ['body'],
    defaultSort: '-created',
    expand: 'author,procedure',
    description: 'Ratings awaiting moderation.',
    listColumns: [
      { name: 'rating', label: 'Rating', kind: 'number' },
      { name: 'body', label: 'Review', kind: 'text' },
      { name: 'author', label: 'Author', kind: 'relation', relationLabel: 'full_name' },
      { name: 'procedure', label: 'Procedure', kind: 'relation', relationLabel: 'title_en' },
      { name: 'approved', label: 'Approved', kind: 'bool' },
      { name: 'created', label: 'Received', kind: 'date' },
    ],
    fields: [
      { name: 'rating', label: 'Rating', kind: 'number', min: 1, max: 5, required: true },
      { name: 'body', label: 'Review', kind: 'textarea' },
      { name: 'approved', label: 'Approved', kind: 'bool' },
    ],
  },
  {
    name: 'contact',
    label: 'Message',
    labelPlural: 'Contact messages',
    group: 'Inbox',
    canCreate: false,
    canDelete: true,
    titleField: 'first_name',
    searchFields: ['first_name', 'last_name', 'email', 'message'],
    defaultSort: '-created',
    expand: 'handled_by',
    description: 'Messages submitted through the public contact form.',
    listColumns: [
      { name: 'first_name', label: 'From', kind: 'text' },
      { name: 'email', label: 'Email', kind: 'text' },
      { name: 'message', label: 'Message', kind: 'text' },
      { name: 'status', label: 'Status', kind: 'badge' },
      { name: 'handled_by', label: 'Handled by', kind: 'relation', relationLabel: 'full_name' },
      { name: 'created', label: 'Received', kind: 'date' },
    ],
    fields: [
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        options: ['new', 'in_progress', 'resolved', 'spam'],
      },
      { name: 'handled_by', label: 'Handled by', kind: 'relation', relation: { collection: 'users' } },
    ],
  },
];

const byName = new Map(collections.map((c) => [c.name as string, c]));

export function getCollectionDef(name: string): CollectionDef | undefined {
  return byName.get(name);
}

export const collectionGroups = ['Content', 'Directory', 'Site', 'People', 'Inbox'] as const;
export type CollectionGroup = (typeof collectionGroups)[number];

/** Expands a field definition into the concrete PocketBase column names it writes. */
export function storedFieldNames(field: FieldDef): string[] {
  return field.translatable
    ? [`${field.name}_en`, `${field.name}_ar`, `${field.name}_ku`]
    : [field.name];
}
