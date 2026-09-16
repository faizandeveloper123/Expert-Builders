import {
  AGE_VALUE_OPTIONS,
  DATE_VALUE_OPTIONS,
  FILTER_CONFIGS,
} from './filterConfigs';

export interface FilterGroup {
  id: string;
  label: string;
  options: string[];
}

export type FilterPropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'date'
  | 'email'
  | 'phone'
  | 'checkbox'
  | 'multiselect'
  | 'none'
  | 'users'
  | 'countries'
  | 'timezones'
  | 'date-options'
  | 'age'
  | 'campaigns'
  | 'workflows';

export interface FilterProperty {
  key: string;
  label: string;
  type: FilterPropertyType;
  options?: string[];
  placeholder?: string;
  /** Used by the "campaigns" type: which campaign status to fetch from the API. */
  status?: 'active' | 'paused' | 'canceled' | 'finished';
  defaultValue?: string | boolean | string[];
}

export type FilterPropertiesMap = Record<string, FilterProperty[]>;

export const FILTER_PROPERTIES: FilterPropertiesMap = {};

/** A filter the user configured and applied to the contact list. */
export interface AppliedFilter {
  name: string;
  condition: string;
  value: string;
}

/** A single sub-condition (AND) nested inside a deep filter rule. */
export interface NestedFilterRule {
  id: number;
  field: string;
  operator: string;
  value: string;
}

/** A deep filter rule card: field + operator + value, plus optional AND sub-conditions. */
export interface FilterRule {
  id: number;
  field: string;
  operator: string;
  value: string;
  nestedRules: NestedFilterRule[];
}

export type FilterKind = 'text' | 'number' | 'date' | 'select' | 'multiselect';

const TEXT_CONDITIONS = ['Contains', 'Does not contain', 'Equals', 'Starts with', 'Ends with', 'Is empty', 'Is not empty'];
const NUMBER_CONDITIONS = ['Equals', 'Greater than', 'Less than', 'Is empty', 'Is not empty'];
const DATE_CONDITIONS = ['Before', 'After', 'On', 'Between', 'Is empty', 'Is not empty'];
const SELECT_CONDITIONS = ['Is', 'Is not'];
const MULTI_CONDITIONS = ['Is any of', 'Is none of'];

const DATE_FILTERS = new Set([
  'Created',
  'Updated',
  'Last activity',
  'Date of birth',
  'Last email clicked date',
  'Last email opened date',
  'Last appointment',
  'Expected close date',
]);

const NUMBER_FILTERS = new Set(['Age', 'Followers', 'Approximate Project Size']);

const MULTISELECT_FILTERS = new Set(['Tag']);

const SELECT_OPTIONS: Record<string, string[]> = {
  'Contact type': ['Lead', 'Customer', 'Vendor', 'Partner'],
  'Email status': ['Valid', 'Invalid', 'Unengaged', 'Bounce', 'Spam'],
  'Whatsapp status': ['Connected', 'Not connected', 'Unsubscribed', 'Read'],
  'Calls & Voicemails DND': ['Yes', 'No'],
  'DND all': ['Yes', 'No'],
  'Email DND': ['Yes', 'No'],
  'FB messenger DND': ['Yes', 'No'],
  'GMB messenger DND': ['Yes', 'No'],
  'Inbound DND': ['Yes', 'No'],
  'SMS DND': ['Yes', 'No'],
  'WhatsApp DND': ['Yes', 'No'],
};

export function filterKind(name: string): FilterKind {
  if (DATE_FILTERS.has(name)) return 'date';
  if (NUMBER_FILTERS.has(name)) return 'number';
  if (MULTISELECT_FILTERS.has(name)) return 'multiselect';
  if (SELECT_OPTIONS[name]) return 'select';
  return 'text';
}

export function filterConditions(name: string): string[] {
  const configured = FILTER_CONFIGS[name];
  if (configured) return configured.operators;
  switch (filterKind(name)) {
    case 'number':
      return NUMBER_CONDITIONS;
    case 'date':
      return DATE_CONDITIONS;
    case 'select':
      return SELECT_CONDITIONS;
    case 'multiselect':
      return MULTI_CONDITIONS;
    default:
      return TEXT_CONDITIONS;
  }
}

/** Properties (condition + value) shown when configuring a filter in the drawer. */
export function getFilterProperties(name: string): FilterProperty[] {
  const configured = FILTER_CONFIGS[name];
  if (configured) {
    const properties: FilterProperty[] = [
      { key: 'condition', label: 'Condition', type: 'select', options: configured.operators },
    ];
    switch (configured.valueType) {
      case 'none':
        properties.push({ key: 'value', label: 'Value', type: 'none', options: [] });
        return properties;
      case 'age':
        properties.push({ key: 'value', label: 'Value', type: 'age', options: AGE_VALUE_OPTIONS });
        return properties;
      case 'date-options':
        properties.push({ key: 'value', label: 'Value', type: 'date-options', options: DATE_VALUE_OPTIONS });
        return properties;
      case 'number':
        properties.push({ key: 'value', label: 'Value', type: 'number' });
        return properties;
      case 'select':
      case 'users':
      case 'countries':
      case 'timezones':
        properties.push({
          key: 'value',
          label: 'Value',
          type: configured.valueType,
          options: configured.options ?? [],
          placeholder: configured.placeholder,
          status: configured.status,
        });
        return properties;
      case 'campaigns':
        properties.push({
          key: 'value',
          label: 'Value',
          type: 'campaigns',
          options: configured.options ?? [],
          placeholder: configured.placeholder,
          status: configured.status,
        });
        return properties;
      case 'workflows':
        properties.push({
          key: 'value',
          label: 'Value',
          type: 'workflows',
          options: configured.options ?? [],
          placeholder: configured.placeholder,
          status: configured.status,
        });
        return properties;
      default:
        properties.push({
          key: 'value',
          label: 'Value',
          type: 'text',
          placeholder: configured.placeholder ?? 'Type here',
        });
        return properties;
    }
  }

  const kind = filterKind(name);
  const properties: FilterProperty[] = [
    { key: 'condition', label: 'Condition', type: 'select', options: filterConditions(name) },
  ];

  if (kind === 'select') {
    properties.push({
      key: 'value',
      label: 'Value',
      type: 'select',
      options: SELECT_OPTIONS[name],
    });
  } else if (kind === 'multiselect') {
    properties.push({
      key: 'value',
      label: 'Tags (comma separated)',
      type: 'text',
      placeholder: 'e.g. warm lead, hot lead',
    });
  } else {
    properties.push({
      key: 'value',
      label: 'Value',
      type: kind === 'date' ? 'date' : kind === 'number' ? 'number' : 'text',
      placeholder: kind === 'date' ? 'yyyy-mm-dd' : kind === 'number' ? 'Enter a number' : 'Type a value',
    });
  }

  return properties;
}

/**
 * Filter fields offered in the picker.
 * Direct contact fields are read via utils.ts FILTER_FIELDS; everything else
 * is resolved case-insensitively from custom_fields, form submissions and
 * imported Excel columns (utils.ts findCustomValue), so fields like City,
 * Country, Website, etc. evaluate whatever data the contact actually has.
 */
export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'contact',
    label: 'Contact information',
    options: [
      'Age',
      'Business name',
      'City',
      'Company name',
      'Contact source',
      'Contact type',
      'Country',
      'Created',
      'Created by',
      'Date of birth',
      'Email',
      'Email status',
      'Facebook ID',
      'First name',
      'Followers',
      'Full name',
      'Google ID',
      'Instagram ID',
      'Last email clicked date',
      'Last email opened date',
      'Last name',
      'Last updated by',
      'Owner',
      'Phone',
      'Postal zip code',
      'Source type',
      'State',
      'Street address',
      'Tag',
      'TikTok lead ID',
      'Timezone',
      'Website',
      'Whatsapp status',
      'Wildcard name',
    ],
  },
  {
    id: 'dnd',
    label: 'DND',
    options: [
      'Calls & Voicemails DND',
      'DND all',
      'Email DND',
      'FB messenger DND',
      'GMB messenger DND',
      'Inbound DND',
      'SMS DND',
      'WhatsApp DND',
    ],
  },
  {
    id: 'activity',
    label: 'Contact activity',
    options: [
      'Active campaign',
      'Campaign status',
      'Canceled campaign',
      'Finished campaign',
      'Import',
      'Last activity',
      'Last activity type',
      'Last appointment',
      'Paused campaign',
      'Updated',
      'Workflow (active)',
      'Workflow (finished)',
    ],
  },
  {
    id: 'opportunity',
    label: 'Opportunity information',
    options: ['Opportunity pipeline', 'Opportunity stage', 'Opportunity status'],
  },
  {
    id: 'portal',
    label: 'Client portal',
    options: ['Groups', 'Offer', 'Product'],
  },
  {
    id: 'attribution',
    label: 'Attribution',
    options: [
      'Attribution FB click ID',
      'Attribution google click ID',
      'Attribution medium',
      'Attribution source',
      'Attribution UTM ad group ID',
      'Attribution UTM ad ID',
      'Attribution UTM campaign',
      'Attribution UTM campaign ID',
      'Attribution UTM content',
      'Attribution UTM keyword',
      'Attribution UTM match type',
      'Attribution UTM medium',
      'Attribution UTM source',
      'Attribution UTM term',
      'First attribution',
      'Last attribution',
    ],
  },
  {
    id: 'additional',
    label: 'Additional Info',
    options: [
      'Additional Project Details',
      'Approximate Project Size',
      'Project Flooring Type',
      'What Type Of Flooring Are You Interested In?',
      'When Would You Like To Start?',
    ],
  },
  {
    id: 'form',
    label: 'Form | Auto Dealer Contact Us',
    options: ['Model Of The Bike - Evee'],
  },
];

export const SORT_OPTIONS = [
  'First name',
  'Last name',
  'Email',
  'Phone',
  'Date of birth',
  'Contact source',
  'Contact type',
  'Contact name',
  'DND',
  'Created (PKT)',
  'Updated (PKT)',
  'Business name',
  'Street address',
  'City',
  'Country',
  'State',
  'Postal code',
  'Website',
  'Timezone',
  'Company name',
  'What Type of Flooring Are You Interested In?',
  'Approximate Project Size',
  'When Would You Like to Start?',
  'Additional Project Details',
  'Project Flooring Type',
  'Last activity (PKT)',
];
