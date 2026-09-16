import type { Contact, FormSubmissionData } from './types';
import type { ApiContact } from './api';
import { api, API_BASE } from './api';
import type { AppliedFilter, FilterRule } from './data/smartListOptions';

/** Minimal serializable shape of a form that can live in a shareable URL. */
export interface PublicFormPayload {
  name: string;
  columns?: 1 | 2;
  campaignId?: number;
  header?: {
    image: string;
    title: string;
    accentColor: string;
    titleFont?: string;
    titleColor?: string;
    hideTitle?: boolean;
  };
  elements: {
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    buttonColor?: string;
    buttonTextColor?: string;
  }[];
}

/** Encode a form into a URL-safe token that can be placed in the hash. */
export function serializeFormForUrl(form: PublicFormPayload): string {
  const json = JSON.stringify(form);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return encodeURIComponent(b64);
}

/** Decode a URL token produced by serializeFormForUrl back into a form. */
export function deserializeFormFromUrl(data: string): PublicFormPayload | null {
  try {
    const b64 = decodeURIComponent(data);
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as PublicFormPayload;
  } catch {
    return null;
  }
}

const hostedImageCache = new Map<string, string>();

/**
 * When a form header image is a huge base64 data URI (kept at original quality)
 * it blows up the shareable URL. Upload it once to the server and return a short
 * `/Yadea/api/index.php/form-images/{id}` reference instead. Remote URLs and
 * tiny SVGs pass through untouched.
 */
export async function hostFormImage(image: string | undefined | null): Promise<string | undefined> {
  if (!image) return image ?? undefined;
  if (!image.startsWith('data:image/') || !image.includes(';base64,')) return image;
  const cached = hostedImageCache.get(image);
  if (cached) return cached;
  try {
    const res = await api.uploadFormImage(image);
    const short = `${API_BASE}/form-images/${res.data.id}`;
    hostedImageCache.set(image, short);
    return short;
  } catch {
    // Fall back to the embedded data URI so sharing still works offline.
    return image;
  }
}

/** Build a shareable payload, replacing any data-URI header image with a short hosted URL. */
export async function publicPayloadWithHostedImage(payload: PublicFormPayload): Promise<PublicFormPayload> {
  if (!payload.header) return payload;
  const image = await hostFormImage(payload.header.image);
  if (image === undefined || image === payload.header.image) return payload;
  return { ...payload, header: { ...payload.header, image } };
}

export function initialsFromName(name: string): string {
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'NC'
  );
}

/** "2026-08-08 15:50:00" -> "Aug 8, 2026 03:50 PM" */
export function formatDbDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

/**
 * Read an image file and return a compact data URL for storage.
 * Larger photos are downscaled to fit MAX_AVATAR_DIM on its longest side and
 * re-encoded as JPEG so the base64 payload stays far below the server's
 * max_allowed_packet limit (keeps MySQL from disconnecting on big uploads).
 */
export const AVATAR_MAX_DIM = 400;
const AVATAR_MAX_DATA_URL = 650_000;

/** Returns the file's original data URL without resizing or re-compression. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the image file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function fileToResizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the image file'));
    reader.onload = async () => {
      const raw = String(reader.result);
      try {
        const img = new Image();
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('Invalid image file'));
          img.src = raw;
        });

        if (img.width <= AVATAR_MAX_DIM && img.height <= AVATAR_MAX_DIM && raw.length <= AVATAR_MAX_DATA_URL) {
          resolve(raw);
          return;
        }

        const scale = Math.min(1, AVATAR_MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(raw);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch (err) {
        reject(err as Error);
      }
    };
    reader.readAsDataURL(file);
  });
}

export function mapApiContact(a: ApiContact): Contact {
  return {
    id: a.id,
    name: a.name,
    initials: initialsFromName(a.name),
    avatarColor: a.avatar_color,
    image: a.avatar_data ?? undefined,
    phone: a.phone ?? undefined,
    email: a.email ?? undefined,
    businessName: a.business_name ?? undefined,
    contactType: a.contact_type || undefined,
    owner: a.assigned_to_name ?? undefined,
    ownerAvatar: a.assigned_to_avatar ?? undefined,
    assignedTo: a.assigned_to,
    createdPkt: formatDbDate(a.created_at),
    lastActivityPkt: formatDbDate(a.last_activity_at),
    updatedPkt: formatDbDate(a.updated_at),
    sortCreated: a.created_at ?? undefined,
    sortActivity: a.last_activity_at ?? undefined,
    sortUpdated: a.updated_at ?? undefined,
    tags: a.tags,
    customFields: a.custom_fields,
    followers: a.followers,
    isHighlighted: false,
  };
}

/** Read the form submissions attached to a contact's custom_fields. */
export function formSubmissionsOf(customFields?: Record<string, unknown> | null): FormSubmissionData[] {
  const raw = customFields?.['form_submissions'];
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is FormSubmissionData =>
      !!s && typeof s === 'object' && typeof (s as Record<string, unknown>).formName === 'string'
  );
}

/** Find the first column header that matches any of the given patterns. */
export function pickColumn(headers: string[], patterns: RegExp[]): string | undefined {
  for (const p of patterns) {
    const hit = headers.find((h) => p.test(h.trim()));
    if (hit) return hit;
  }
  return undefined;
}

/** Normalize a header (Excel export can give `first_name`, `First-Name`, `FullName`). */
export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[_\-\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Find a column whose normalized header matches any pattern, returning the real header. */
export function pickNormalizedColumn(headers: string[], patterns: RegExp[]): string | undefined {
  const norm = headers.map(normalizeHeader);
  for (const p of patterns) {
    const idx = norm.findIndex((h) => p.test(h));
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

/* ------------------ SMART LIST FILTER EVALUATION ------------------ */

/** Direct fields on the mapped Contact that filters can read. */
const FILTER_FIELDS: Record<string, (c: Contact) => unknown> = {
  'Full name': (c) => c.name,
  'First name': (c) => (c.name ?? '').split(' ')[0] ?? '',
  'Last name': (c) => {
    const parts = (c.name ?? '').split(' ').filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  },
  Email: (c) => c.email,
  Phone: (c) => c.phone,
  'Business name': (c) => c.businessName,
  'Company name': (c) => c.businessName,
  'Contact type': (c) => c.contactType,
  Owner: (c) => c.owner,
  Tag: (c) => c.tags ?? [],
  Created: (c) => c.sortCreated,
  Updated: (c) => c.sortUpdated,
  'Last activity': (c) => c.sortActivity,
};

/** Compare field labels ignoring case, whitespace and punctuation. */
function normalizeKey(k: string): string {
  return k
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');
}

/** Look a field up case/space-insensitively across custom_fields, form submissions and imports. */
export function findCustomValue(contact: Contact, name: string): unknown {
  const custom = contact.customFields;
  if (!custom) return undefined;
  const norm = normalizeKey(name);
  const first = <T>(list: string[], get: (k: string) => T): T | undefined => {
    for (const k of list) {
      const v = get(k);
      if (v !== '' && v !== null && v !== undefined) return v;
    }
    return undefined;
  };

  const customValue = first(Object.keys(custom), (k) =>
    normalizeKey(k) === norm ? custom[k] : undefined
  );
  if (customValue !== undefined) return customValue;

  const subs = custom['form_submissions'];
  if (Array.isArray(subs)) {
    for (const sub of subs) {
      if (!sub || typeof sub !== 'object') continue;
      const values = (sub as { values?: unknown }).values;
      if (!values || typeof values !== 'object') continue;
      const rec = values as Record<string, unknown>;
      const found = first(Object.keys(rec), (k) => (normalizeKey(k) === norm ? rec[k] : undefined));
      if (found !== undefined) return found;
    }
  }

  const imp = custom['import_data'];
  if (imp && typeof imp === 'object') {
    const rec = imp as Record<string, unknown>;
    const found = first(Object.keys(rec), (k) => (normalizeKey(k) === norm ? rec[k] : undefined));
    if (found !== undefined) return found;
  }

  return undefined;
}

/** Any other filter name is evaluated against the contact's custom fields. */
function filterFieldValue(contact: Contact, name: string): unknown {
  const accessor = FILTER_FIELDS[name];
  if (accessor) return accessor(contact);
  return findCustomValue(contact, name);
}

function stringValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return (v as unknown[]).map(String).join(',').toLowerCase();
  return String(v);
}

const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

function dateKey(value: unknown): string | null {
  const match = stringValue(value).match(ISO_DATE_PREFIX);
  return match ? match[0] : null;
}

/** True when a single contact satisfies one configured filter. */
export function matchesFilter(contact: Contact, filter: AppliedFilter): boolean {
  const raw = filterFieldValue(contact, filter.name);
  const val = (filter.value ?? '').trim();
  const cond = filter.condition;

  if (filter.name === 'Tag') {
    const tags = Array.isArray(raw) ? (raw as string[]) : [];
    const wanted = val.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const hasAny = tags.some((t) => wanted.includes(t.toLowerCase()));
    if (cond === 'Is any of' || cond === 'In any of' || cond === 'Is') return wanted.length === 0 || hasAny;
    if (cond === 'Is none of' || cond === 'In none of' || cond === 'Is not') return !hasAny;
    if (cond === 'Is empty') return tags.length === 0;
    if (cond === 'Is not empty') return tags.length > 0;
  }

  const isDate = ['Created', 'Updated', 'Last activity', 'Date of birth', 'Last appointment'].includes(filter.name);
  if (isDate && cond !== 'Is empty' && cond !== 'Is not empty') {
    const key = dateKey(raw);
    if (cond === 'On') return key !== null && key === val;
    if (cond === 'Before') return key !== null && key < val;
    if (cond === 'After') return key !== null && key > val;
    if (cond === 'Between') {
      const [a, b] = val.split('|').map((s) => s.trim());
      if (key === null || !a) return false;
      if (!b) return key >= a;
      return key >= a && key <= b;
    }
    if (cond === 'Is' || cond === 'Is not') {
      if (key === null) return cond === 'Is not';
      const m = matchesRelativeDate(key, val);
      return cond === 'Is' ? m : !m;
    }
  }

  if (filter.name === 'Age' && (cond === 'Is' || cond === 'Is not')) {
    const m = matchesAgeValue(raw, val);
    return cond === 'Is' ? m : !m;
  }

  if (cond === 'Enabled' || cond === 'Disabled') {
    const v = stringValue(raw);
    return cond === 'Enabled' ? v !== '' : v === '';
  }

  if (cond === 'Is empty') return stringValue(raw) === '';
  if (cond === 'Is not empty') return stringValue(raw) !== '';

  if (cond === 'Greater than' || cond === 'Less than') {
    const n = Number(raw);
    const nv = Number(val);
    if (Number.isNaN(n) || Number.isNaN(nv)) return false;
    return cond === 'Greater than' ? n > nv : n < nv;
  }

  if (cond === 'In any of' || cond === 'Is any of' || cond === 'In none of' || cond === 'Is none of') {
    const tokens = val.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const src = stringValue(raw).toLowerCase();
    const any = tokens.length === 0 || tokens.some((t) => src === t || src.includes(t));
    return cond === 'In none of' || cond === 'Is none of' ? !any : any;
  }

  const source = stringValue(raw).toLowerCase();
  const target = val.toLowerCase();
  switch (cond) {
    case 'Contains':
      return source.includes(target);
    case 'Does not contain':
      return !source.includes(target);
    case 'Equals':
    case 'Is':
    case 'Batch id is':
      return source === target;
    case 'Is not':
      return source !== target;
    case 'Starts with':
      return source.startsWith(target);
    case 'Ends with':
      return source.endsWith(target);
    default:
      return true;
  }
}

/** Evaluate a date-option value ("Today", "This month", "On|2026-08-12", ...) against an ISO date key. */
function matchesRelativeDate(key: string, value: string): boolean {
  const parts = value.split('|').map((s) => s.trim());
  const opt = parts[0] ?? '';
  const today = new Date();
  const tKey = toDateKey(today);
  switch (opt) {
    case 'Today':
      return key === tKey;
    case 'Yesterday':
      return key === addDays(today, -1);
    case 'Tomorrow':
      return key === addDays(today, 1);
    case 'This week':
      return key >= startOfWeek(today) && key <= addDays(today, 6 - ((today.getDay() + 6) % 7));
    case 'This month':
    case 'In month':
      return key >= startOfMonth(today) && key <= endOfMonth(today);
    case 'This quarter':
      return key >= startOfQuarter(today) && key <= endOfQuarter(today);
    case 'This year':
      return key >= startOfYear(today) && key <= endOfYear(today);
    case 'On':
      return parts[1] ? key === parts[1] : true;
    case 'After date':
      return parts[1] ? key > parts[1] : true;
    case 'Before date':
      return parts[1] ? key < parts[1] : true;
    case 'Between': {
      const [a, b] = [parts[1], parts[2]];
      if (!a || !b) return true;
      return key >= a && key <= b;
    }
    case 'More than': {
      const n = Number(parts[1]);
      if (!parts[1] || Number.isNaN(n)) return true;
      return key < addDays(today, -n * unitToDays(parts[3]));
    }
    case 'Less than': {
      const n = Number(parts[1]);
      if (!parts[1] || Number.isNaN(n)) return true;
      return key > addDays(today, -n * unitToDays(parts[3]));
    }
    case 'In the next': {
      const n = Number(parts[1]);
      if (!parts[1] || Number.isNaN(n)) return true;
      return key > tKey && key <= addDays(today, n * unitToDays(parts[3]));
    }
    case 'In the last': {
      const n = Number(parts[1]);
      if (!parts[1] || Number.isNaN(n)) return true;
      return key >= addDays(today, -n * unitToDays(parts[3])) && key <= tKey;
    }
    default:
      if (/^\d{4}-\d{2}-\d{2}/.test(opt)) return key === opt;
      return true;
  }
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function unitToDays(unit?: string): number {
  switch ((unit ?? '').toLowerCase()) {
    case 'years':
    case 'year':
      return 365;
    case 'months':
    case 'month':
      return 30;
    case 'weeks':
    case 'week':
      return 7;
    default:
      return 1;
  }
}

function addDays(d: Date, n: number): string {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return toDateKey(c);
}

function startOfWeek(d: Date): string {
  const c = new Date(d);
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return toDateKey(c);
}

function startOfMonth(d: Date): string {
  return toDateKey(new Date(d.getFullYear(), d.getMonth(), 1));
}

function endOfMonth(d: Date): string {
  return toDateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function startOfYear(d: Date): string {
  return `${d.getFullYear()}-01-01`;
}

function endOfYear(d: Date): string {
  return `${d.getFullYear()}-12-31`;
}

function startOfQuarter(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return toDateKey(new Date(d.getFullYear(), q, 1));
}

function endOfQuarter(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return toDateKey(new Date(d.getFullYear(), q + 3, 0));
}

/** Evaluate the Age quantity value ("Equals to|25|Years", "Between|20|30|Years", "More than|40|Months"). */
function matchesAgeValue(raw: unknown, value: string): boolean {
  const parts = value.split('|').map((s) => s.trim());
  const q = parts[0] ?? 'Equals to';
  const a = Number(parts[1]);
  const n = Number(raw);
  if (Number.isNaN(n)) return false;
  if (!parts[1] || Number.isNaN(a)) return true;
  const norm = n * ageUnitFactor(parts[3]);
  if (q === 'Between') {
    const b = Number(parts[2]);
    if (parts[2] && !Number.isNaN(b)) return norm >= a && norm <= b;
    return norm >= a;
  }
  if (q === 'More than') return norm > a;
  if (q === 'Less than') return norm < a;
  return norm === a;
}

/** Convert a raw age (in years) into the selected unit (years/months/weeks/days). */
function ageUnitFactor(unit?: string): number {
  switch ((unit ?? '').toLowerCase()) {
    case 'months':
    case 'month':
      return 12;
    case 'weeks':
    case 'week':
      return 52;
    case 'days':
    case 'day':
      return 365;
    default:
      return 1;
  }
}

/** True when a contact satisfies every applied filter (AND semantics). */
export function matchesFilters(contact: Contact, filters: AppliedFilter[]): boolean {
  return filters.every((f) => matchesFilter(contact, f));
}

/* ------------------ DEEP FILTER RULE EVALUATION ------------------ */

/**
 * Evaluate one deep filter rule (and its AND sub-conditions) against a contact.
 * A rule without a configured value passes (like the reference builder), and:
 *   - every sub-condition must pass too (AND semantics)
 *   - sub-conditions reuse the same applied-filter evaluation engine
 */
export function matchesRule(contact: Contact, rule: FilterRule): boolean {
  if (!matchesRuleBase(contact, rule.field, rule.operator, rule.value)) return false;
  return (rule.nestedRules ?? []).every((nested) =>
    matchesRuleBase(contact, nested.field, nested.operator, nested.value)
  );
}

function matchesRuleBase(contact: Contact, field: string, operator: string, value: string): boolean {
  if (!field) return true;
  const isEmptyOp = operator === 'Is empty' || operator === 'Is not empty';
  if (!isEmptyOp && (value ?? '').trim() === '') return true;
  return matchesFilter(contact, { name: field, condition: operator, value });
}

/** True when a contact satisfies every active deep filter rule (AND semantics). */
export function matchesRules(contact: Contact, rules: FilterRule[]): boolean {
  return rules.every((r) => matchesRule(contact, r));
}

/* ----------------------- USER ROLES ----------------------- */

export type UserRole = 'Admin' | 'Dealer' | 'Follower';

export const ROLE_LABEL: Record<UserRole, string> = {
  Admin: 'Administrator',
  Dealer: 'Dealer',
  Follower: 'Follower',
};

/** Tailwind badge classes for each role. */
export const ROLE_BADGE: Record<UserRole, string> = {
  Admin: 'bg-purple-100 text-purple-700 border-purple-200',
  Dealer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Follower: 'bg-blue-100 text-blue-700 border-blue-200',
};
