/**
 * Complete filter configuration sheet (one entry per filter name).
 *
 * operators  -> the "DropDown1" (condition) options shown in the rule builder
 * valueType  -> how the value ("Please Select") column is rendered:
 *                 none        no value input (DND enabled/disabled etc.)
 *                 text        free text input
 *                 number      numeric input
 *                 select      dropdown of `options`
 *                 age         quantity dropdown + numeric input(s)
 *                 users        dropdown of CRM staff users
 *                 countries    dropdown of all countries
 *                 timezones    dropdown of all timezones
 *                 date-options dropdown of relative date options (today, this week, ...)
 *                 campaigns    dropdown of campaigns fetched from the API (filter by `status`)
 *                 workflows    dropdown of workflows fetched from the API (filter by `status`)
 */

export type FilterValueType =
  | 'none'
  | 'text'
  | 'number'
  | 'select'
  | 'age'
  | 'users'
  | 'countries'
  | 'timezones'
  | 'date-options'
  | 'campaigns'
  | 'workflows';

export type FilterCampaignStatus = 'active' | 'paused' | 'canceled' | 'finished';

export interface FilterConfig {
  operators: string[];
  valueType: FilterValueType;
  options?: string[];
  placeholder?: string;
  /** Only used by the "campaigns" valueType: which campaign status the dropdown should fetch. */
  status?: FilterCampaignStatus;
}

export const AGE_VALUE_OPTIONS = ['Equals to', 'Between', 'More than', 'Less than'];

export const DATE_VALUE_OPTIONS = [
  'Today',
  'Yesterday',
  'Tomorrow',
  'This week',
  'This month',
  'This quarter',
  'In month',
  'This year',
  'On',
  'Between',
  'More than',
  'Less than',
  'After date',
  'Before date',
  'In the next',
  'In the last',
];

const ACTIVE_CAMPAIGN_WITH_EMPTY: FilterConfig = {
  operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
  valueType: 'campaigns',
  status: 'active',
  placeholder: 'Select an active campaign',
};

const CAMPAIGN_FILTERS: Record<FilterCampaignStatus, FilterConfig> = {
  active: {
    operators: ['Is', 'Is not'],
    valueType: 'campaigns',
    status: 'active',
    placeholder: 'Select an active campaign',
  },
  paused: {
    operators: ['Is', 'Is not'],
    valueType: 'campaigns',
    status: 'paused',
    placeholder: 'Select a paused campaign',
  },
  canceled: {
    operators: ['Is', 'Is not'],
    valueType: 'campaigns',
    status: 'canceled',
    placeholder: 'Select a canceled campaign',
  },
  finished: {
    operators: ['Is', 'Is not'],
    valueType: 'campaigns',
    status: 'finished',
    placeholder: 'Select a finished campaign',
  },
};

const WORKFLOW_FILTERS: Record<'active' | 'finished', FilterConfig> = {
  active: {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'workflows',
    status: 'active',
    placeholder: 'Select an active workflow',
  },
  finished: {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'workflows',
    status: 'finished',
    placeholder: 'Select a finished workflow',
  },
};

const DATE_FILTERS: FilterConfig = {
  operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
  valueType: 'date-options',
};

const SIMPLE_TEXT: FilterConfig = {
  operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
  valueType: 'text',
};

const TWO_OPTION: FilterConfig = {
  operators: ['Is', 'Is not'],
  valueType: 'text',
};

export const FILTER_CONFIGS: Record<string, FilterConfig> = {
  /* ---------------- Contact information ---------------- */
  Age: { operators: ['Is', 'Is empty', 'Is not empty'], valueType: 'age' },
  'Business name': {
    operators: ['Is', 'Contains', 'Is not', 'Is empty', 'In any of', 'In none of', 'Is not empty'],
    valueType: 'text',
  },
  City: {
    operators: ['Is', 'Contains', 'Does not contain', 'In any of', 'In none of', 'Is empty', 'Is not empty'],
    valueType: 'text',
  },
  'Company name': {
    operators: ['Is', 'Is not', 'Contains', 'Does not contain', 'In any of', 'In none of', 'Is empty', 'Is not empty'],
    valueType: 'text',
  },
  'Contact source': {
    operators: ['Is', 'Is not', 'Contains', 'Does not contain', 'Is empty', 'Is not empty'],
    valueType: 'text',
  },
  'Contact type': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'select',
    options: ['Lead', 'Customer'],
  },
  Country: {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'countries',
  },
  Created: {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'date-options',
  },
  'Created by': { operators: ['Is', 'Is not'], valueType: 'users' },
  'Date of birth': DATE_FILTERS,
  Email: {
    operators: ['Is', 'Is not', 'In any of', 'In none of', 'Is empty', 'Is not empty', 'Contains'],
    valueType: 'text',
  },
  'Email status': { operators: ['Is', 'Is not'], valueType: 'select', options: ['Valid', 'Invalid', 'Need validation'] },
  'Facebook ID': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'text',
  },
  'First name': {
    operators: ['Is', 'Is not', 'Contains', 'Does not contain', 'In any of', 'In none of', 'Is empty'],
    valueType: 'text',
  },
  Followers: {
    operators: ['Is', 'Is not'],
    valueType: 'users',
  },
  'Full name': {
    operators: ['Is', 'Is not', 'Contains', 'Does not contain', 'In any of', 'In none of', 'Is empty'],
    valueType: 'text',
  },
  'Google ID': SIMPLE_TEXT,
  'Instagram ID': SIMPLE_TEXT,
  'Last email clicked date': DATE_FILTERS,
  'Last email opened date': DATE_FILTERS,
  'Last name': {
    operators: ['Is', 'Contains', 'Does not contain', 'In any of', 'In none of', 'Is empty'],
    valueType: 'text',
  },
  'Last updated by': { operators: ['Is', 'Is not'], valueType: 'users' },
  Owner: {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'users',
  },
  Phone: {
    operators: ['Is', 'Is not', 'In any of', 'In none of', 'Is empty', 'Is not empty', 'Contains'],
    valueType: 'text',
  },
  'Postal zip code': {
    operators: ['Is', 'Is not', 'In any of', 'In none of', 'Is empty', 'Contains', 'Does not contain'],
    valueType: 'text',
  },
  'Source type': SIMPLE_TEXT,
  State: {
    operators: ['Is', 'Is not', 'In any of', 'In none of', 'Is empty', 'Contains', 'Does not contain'],
    valueType: 'text',
  },
  'Street address': {
    operators: ['Is', 'Is not', 'Contains', 'Does not contain', 'In any of', 'In none of', 'Is empty'],
    valueType: 'text',
  },
  Tag: {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty', 'Is any of'],
    valueType: 'select',
    options: ['follow-up', 'hello', 'high priority', 'warm lead'],
    placeholder: 'Please select',
  },
  'TikTok lead ID': SIMPLE_TEXT,
  Timezone: {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'timezones',
  },
  Website: {
    operators: ['Is', 'Is not', 'Contains', 'Does not contain', 'In any of', 'In none of', 'Is empty'],
    valueType: 'text',
  },
  'Whatsapp status': { operators: ['Is', 'Is not'], valueType: 'select', options: ['Valid', 'Invalid', 'Need validation'] },
  'Wildcard name': TWO_OPTION,

  /* ---------------- DND ---------------- */
  'Calls & Voicemails DND': { operators: ['Enabled', 'Disabled'], valueType: 'none' },
  'DND all': { operators: ['Enabled', 'Disabled'], valueType: 'none' },
  'Email DND': { operators: ['Enabled', 'Disabled'], valueType: 'none' },
  'FB messenger DND': { operators: ['Enabled', 'Disabled'], valueType: 'none' },
  'GMB messenger DND': { operators: ['Enabled', 'Disabled'], valueType: 'none' },
  'Inbound DND': { operators: ['Enabled', 'Disabled'], valueType: 'none' },
  'SMS DND': { operators: ['Enabled', 'Disabled'], valueType: 'none' },
  'WhatsApp DND': { operators: ['Enabled', 'Disabled'], valueType: 'none' },

  /* ---------------- Contact activity ---------------- */
  'Active campaign': CAMPAIGN_FILTERS.active,
  'Campaign status': { operators: ['Is', 'Is not'], valueType: 'select', options: ['Active', 'Paused'] },
  'Canceled campaign': CAMPAIGN_FILTERS.canceled,
  'Finished campaign': CAMPAIGN_FILTERS.finished,
  Import: { operators: ['Batch id is'], valueType: 'text', placeholder: 'Enter batch id' },
  'Last activity': DATE_FILTERS,
  'Last activity type': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'select',
    options: [
      'Call',
      'SMS',
      'Email',
      'SMS review request',
      'Webchat',
      'SMS no show request',
      'Campaign SMS',
      'Campaign call',
      'Campaign email',
      'Campaign voicemail',
      'Facebook',
      'Campaign Facebook',
      'Campaign manual call',
      'Campaign manual sms',
      'GMB',
      'Campaign GMB',
      'Review',
      'Instagram',
      'WhatsApp',
      'Custom SMS',
      'Custom email',
      'Custom provider SMS',
      'Custom provider email',
    ],
  },
  'Last appointment': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'date-options',
  },
  'Paused campaign': CAMPAIGN_FILTERS.paused,
  Updated: DATE_FILTERS,
  'Workflow (active)': WORKFLOW_FILTERS.active,
  'Workflow (finished)': WORKFLOW_FILTERS.finished,

  /* ---------------- Opportunity information ---------------- */
  'Opportunity pipeline': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'select',
    options: ['Marketing pipeline'],
  },
  'Opportunity stage': { operators: ['Is'], valueType: 'select', options: ['Marketing pipeline'] },
  'Opportunity status': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'select',
    options: ['Open', 'Won', 'Lost', 'Abandoned'],
  },

  /* ---------------- Client portal ---------------- */
  Groups: { operators: ['Is', 'Is empty', 'Is not empty'], valueType: 'text' },
  Offer: ACTIVE_CAMPAIGN_WITH_EMPTY,
  Product: ACTIVE_CAMPAIGN_WITH_EMPTY,

  /* ---------------- Attribution ---------------- */
  'Attribution FB click ID': TWO_OPTION,
  'Attribution google click ID': TWO_OPTION,
  'Attribution medium': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'select',
    options: [
      'LinkedIn',
      'Facebook',
      'Google',
      'Twitter',
      'Calendar',
      'Forms',
      'Survey',
      'Form',
      'Chat widget',
      'CSV import',
      'Manual API',
      'Order form',
      'Two step order form',
      'Facebook Form',
      'TikTok form',
      'Membership',
      'Conversation',
      'Zapier',
      'Other',
    ],
  },
  'Attribution source': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'select',
    options: [
      'Trigger link',
      'Paid search',
      'Paid social',
      'Social media',
      'Email marketing',
      'Organic search',
      'Referral',
      'Direct traffic',
      'CRM UI',
      'Third party',
      'Other',
    ],
  },
  'Attribution UTM ad group ID': TWO_OPTION,
  'Attribution UTM ad ID': TWO_OPTION,
  'Attribution UTM campaign': SIMPLE_TEXT,
  'Attribution UTM campaign ID': TWO_OPTION,
  'Attribution UTM content': SIMPLE_TEXT,
  'Attribution UTM keyword': SIMPLE_TEXT,
  'Attribution UTM match type': SIMPLE_TEXT,
  'Attribution UTM medium': SIMPLE_TEXT,
  'Attribution UTM source': SIMPLE_TEXT,
  'Attribution UTM term': SIMPLE_TEXT,
  'First attribution': { operators: ['Is empty', 'Is not empty'], valueType: 'none' },
  'Last attribution': { operators: ['Is empty', 'Is not empty'], valueType: 'none' },

  /* ---------------- Additional Info ---------------- */
  'Additional Project Details': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty', 'Contains', 'Does not contain'],
    valueType: 'text',
  },
  'Approximate Project Size': {
    operators: ['Is', 'Is not', 'Is empty', 'Is not empty'],
    valueType: 'select',
    options: ['Under 500 sq. ft.', '500-1000 sq. ft.', '1000-2000 sq. ft.', '2000+ sq. ft.', 'Not sure'],
  },
};