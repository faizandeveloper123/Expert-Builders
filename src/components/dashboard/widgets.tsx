import type { ReactNode } from 'react';
import type { ApiContact, DealerDashboardDealer, DealerLead, DealerLeadStatus } from '../../api';
import { STATUS_COLORS, STATUS_META } from './widgetMeta';

export type WidgetChartType = 'number' | 'donut' | 'line' | 'bar' | 'funnel' | 'table';

export type WidgetCategory =
  | 'Contacts'
  | 'Appointments'
  | 'Opportunities'
  | 'Visitor data'
  | 'Emails'
  | 'SMS'
  | 'Calls'
  | 'Conversations'
  | 'Payments'
  | 'Meta Ads'
  | 'Google Ads'
  | 'Social Planner'
  | 'General'
  | 'Google Analytics';

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  'Contacts',
  'Appointments',
  'Opportunities',
  'Visitor data',
  'Emails',
  'SMS',
  'Calls',
  'Conversations',
  'Payments',
  'Meta Ads',
  'Google Ads',
  'Social Planner',
  'General',
  'Google Analytics',
];

export interface DashboardDataset {
  isOwner: boolean;
  dealerId: number;
  contacts: ApiContact[];
  dealers: DealerDashboardDealer[];
  unassigned: number;
  dealerLeads: DealerLead[];
}

export interface WidgetInstance {
  uid: string;
  defId: string;
  title: string;
  size: 'sm' | 'md' | 'lg';
  w?: number;
  h?: number;
  /** User-configured appearance (display type, colours, chart options). */
  settings?: WidgetSettings;
}

/** Per-widget appearance settings, editable from the widget config panel. */
export interface WidgetSettings {
  /** How the widget is rendered; 'auto' keeps the widget's native style. */
  display?: WidgetChartType | 'auto';
  /** Colour palette override (series colours; line uses the first entry). */
  palette?: string[];
  /** Bar charts only: render bars horizontally. */
  horizontal?: boolean;
  /** Donut charts only: hole size, e.g. '62%'. */
  cutout?: string;
  /** Line charts only: fill the area under the curve. */
  fillArea?: boolean;
}

export type WidgetRole = 'Admin' | 'Dealer' | 'Follower';

export interface WidgetDef {
  id: string;
  title: string;
  category: WidgetCategory;
  chartType: WidgetChartType;
  icon: ReactNode;
  description: string;
  defaultSize: 'sm' | 'md' | 'lg';
  horizontal?: boolean;
  compute: (d: DashboardDataset) => WidgetData;
}

export type WidgetData =
  | { kind: 'number'; value: number | string; sub?: string; accent?: string }
  | { kind: 'donut'; labels: string[]; values: number[]; colors?: string[]; centerText?: string; cutout?: string }
  | { kind: 'line'; labels: string[]; values: number[]; color?: string; fill?: boolean }
  | { kind: 'bar'; labels: string[]; values: number[]; colors?: string[]; horizontal?: boolean }
  | { kind: 'funnel'; stages: { label: string; value: number; color: string }[] }
  | { kind: 'table'; columns: string[]; rows: (string | number)[][]; contactIds?: (number | null)[] }
| { kind: 'stage-list'; leads: { contactId: number; name: string; phone: string | null; status: DealerLeadStatus }[] }
| { kind: 'lead-list'; leads: { contactId: number; name: string; phone: string | null; status: DealerLeadStatus }[] };

const STATUS_STAGES = ['non_contacted', 'contacted', 'closed', 'customer'] as const;
const ALL_STATUSES = ['non_contacted', 'contacted', 'closed', 'customer', 'rejected'] as const;

function statusBreakdown(items: DealerLead[]) {
  const counts: Record<string, number> = {
    non_contacted: 0,
    contacted: 0,
    closed: 0,
    customer: 0,
    rejected: 0,
  };
  for (const l of items) counts[l.status] = (counts[l.status] ?? 0) + 1;
  return counts;
}

function fmtName(c: ApiContact): string {
  return c.name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown';
}

function byMonth(items: { created_at: string | null }[]): { labels: string[]; values: number[] } {
  const now = new Date();
  const months: string[] = [];
  const values: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString('en-US', { month: 'short' }));
    values.push(0);
  }
  for (const it of items) {
    if (!it.created_at) continue;
    const t = new Date(it.created_at.replace(' ', 'T'));
    if (Number.isNaN(t.getTime())) continue;
    const idx = (t.getFullYear() - now.getFullYear()) * 12 + (t.getMonth() - now.getMonth());
    if (idx >= 0 && idx < 6) values[5 - idx] += 1;
  }
  return { labels: months, values };
}

const CONTACT_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

function contactTypeGroups(contacts: ApiContact[]) {
  const map = new Map<string, number>();
  for (const c of contacts) {
    const key = c.contact_type || 'Other';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function ownerGroups(contacts: ApiContact[]) {
  const map = new Map<string, number>();
  for (const c of contacts) {
    const key = c.assigned_to_name || 'Unassigned';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function tagGroups(contacts: ApiContact[]) {
  const map = new Map<string, number>();
  for (const c of contacts) {
    for (const t of c.tags ?? []) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function recentContacts(contacts: ApiContact[]): WidgetData {
  const sorted = [...contacts]
    .filter((c) => c.created_at)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 8);
  return {
    kind: 'table',
    columns: ['Name', 'Phone', 'Type', 'Owner'],
    rows: sorted.map((c) => [fmtName(c), c.phone ?? '—', c.contact_type || 'Other', c.assigned_to_name ?? '—']),
    contactIds: sorted.map((c) => c.id),
  };
}

export const WIDGET_DEFS: WidgetDef[] = [
  /* ------------------- CONTACTS ------------------- */
  {
    id: 'contacts-total',
    title: 'Total Contacts',
    category: 'Contacts',
    chartType: 'number',
    icon: '👥',
    description: 'Total number of contacts in the CRM',
    defaultSize: 'sm',
    compute: (d) => ({ kind: 'number', value: d.contacts.length, sub: 'contacts in CRM' }),
  },
  {
    id: 'contacts-leads-count',
    title: 'Total Leads',
    category: 'Contacts',
    chartType: 'number',
    icon: '📈',
    description: 'Contacts marked as leads (is_lead)',
    defaultSize: 'sm',
    compute: (d) => ({
      kind: 'number',
      value: d.contacts.filter((c) => c.is_lead === 1 || c.contact_type === 'Lead').length,
      sub: 'active leads',
    }),
  },
  {
    id: 'contacts-with-email',
    title: 'Contacts with Email',
    category: 'Contacts',
    chartType: 'number',
    icon: '📧',
    description: 'Contacts that have an email address',
    defaultSize: 'sm',
    compute: (d) => ({
      kind: 'number',
      value: d.contacts.filter((c) => c.email).length,
      sub: 'of ' + d.contacts.length + ' contacts',
    }),
  },
  {
    id: 'contacts-with-phone',
    title: 'Contacts with Phone',
    category: 'Contacts',
    chartType: 'number',
    icon: '📞',
    description: 'Contacts that have a phone number',
    defaultSize: 'sm',
    compute: (d) => ({
      kind: 'number',
      value: d.contacts.filter((c) => c.phone).length,
      sub: 'of ' + d.contacts.length + ' contacts',
    }),
  },
  {
    id: 'contacts-with-business',
    title: 'Contacts with Business',
    category: 'Contacts',
    chartType: 'number',
    icon: '🏢',
    description: 'Contacts that have a business name',
    defaultSize: 'sm',
    compute: (d) => ({
      kind: 'number',
      value: d.contacts.filter((c) => c.business_name).length,
      sub: 'of ' + d.contacts.length + ' contacts',
    }),
  },
  {
    id: 'contacts-created-this-month',
    title: 'Contacts This Month',
    category: 'Contacts',
    chartType: 'number',
    icon: '🆕',
    description: 'Contacts created in the current month',
    defaultSize: 'sm',
    compute: (d) => {
      const now = new Date();
      const count = d.contacts.filter((c) => {
        if (!c.created_at) return false;
        const t = new Date(c.created_at.replace(' ', 'T'));
        return !Number.isNaN(t.getTime()) && t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
      }).length;
      return { kind: 'number', value: count, sub: 'created this month' };
    },
  },
  {
    id: 'contacts-by-type',
    title: 'Contacts by Type',
    category: 'Contacts',
    chartType: 'donut',
    icon: '🍩',
    description: 'Contact type distribution (Lead / Customer / Vendor / Partner)',
    defaultSize: 'md',
    compute: (d) => {
      const groups = contactTypeGroups(d.contacts);
      return {
        kind: 'donut',
        labels: groups.map(([k]) => k),
        values: groups.map(([, v]) => v),
        colors: CONTACT_PALETTE,
      };
    },
  },
  {
    id: 'contacts-by-type-bar',
    title: 'Contacts by Type (Bar)',
    category: 'Contacts',
    chartType: 'bar',
    icon: '📊',
    description: 'Contact type distribution as a bar chart',
    defaultSize: 'md',
    compute: (d) => {
      const groups = contactTypeGroups(d.contacts);
      return {
        kind: 'bar',
        labels: groups.map(([k]) => k),
        values: groups.map(([, v]) => v),
        colors: CONTACT_PALETTE,
      };
    },
  },
  {
    id: 'contacts-by-owner',
    title: 'Contacts by Owner',
    category: 'Contacts',
    chartType: 'bar',
    icon: '👤',
    description: 'Contacts grouped by their assigned owner',
    defaultSize: 'md',
    horizontal: true,
    compute: (d) => {
      const groups = ownerGroups(d.contacts).slice(0, 8);
      return {
        kind: 'bar',
        labels: groups.map(([k]) => k),
        values: groups.map(([, v]) => v),
        colors: CONTACT_PALETTE,
        horizontal: true,
      };
    },
  },
  {
    id: 'contacts-by-tag',
    title: 'Contacts by Tag',
    category: 'Contacts',
    chartType: 'bar',
    icon: '🏷️',
    description: 'Most used contact tags',
    defaultSize: 'md',
    horizontal: true,
    compute: (d) => {
      const groups = tagGroups(d.contacts).slice(0, 8);
      return {
        kind: 'bar',
        labels: groups.map(([k]) => k),
        values: groups.map(([, v]) => v),
        colors: CONTACT_PALETTE,
        horizontal: true,
      };
    },
  },
  {
    id: 'contacts-created-line',
    title: 'Contacts Created',
    category: 'Contacts',
    chartType: 'line',
    icon: '📉',
    description: 'Contacts created over the last 6 months',
    defaultSize: 'md',
    compute: (d) => {
      const { labels, values } = byMonth(d.contacts);
      return { kind: 'line', labels, values };
    },
  },
  {
    id: 'contacts-recent',
    title: 'Recent Contacts',
    category: 'Contacts',
    chartType: 'table',
    icon: '🕑',
    description: 'Latest contacts added to the CRM',
    defaultSize: 'lg',
    compute: (d) => recentContacts(d.contacts),
  },
  {
    id: 'contacts-by-company',
    title: 'Contacts by Company',
    category: 'Contacts',
    chartType: 'bar',
    icon: '🏢',
    description: 'Contacts mapped to different company names',
    defaultSize: 'md',
    horizontal: true,
    compute: (d) => {
      const map = new Map<string, number>();
      for (const c of d.contacts) {
        const key = c.business_name || 'Unknown';
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      const groups = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
      return {
        kind: 'bar',
        labels: groups.map(([k]) => k),
        values: groups.map(([, v]) => v),
        colors: CONTACT_PALETTE,
        horizontal: true,
      };
    },
  },
  {
    id: 'contacts-without-email',
    title: 'Contacts Without Email',
    category: 'Contacts',
    chartType: 'number',
    icon: '📧',
    description: 'Contacts that have no email address',
    defaultSize: 'sm',
    compute: (d) => ({
      kind: 'number',
      value: d.contacts.filter((c) => !c.email).length,
      sub: 'without email',
    }),
  },
  {
    id: 'contacts-without-phone',
    title: 'Contacts Without Phone',
    category: 'Contacts',
    chartType: 'number',
    icon: '📵',
    description: 'Contacts that have no phone number',
    defaultSize: 'sm',
    compute: (d) => ({
      kind: 'number',
      value: d.contacts.filter((c) => !c.phone).length,
      sub: 'without phone',
    }),
  },
  {
    id: 'contacts-mine',
    title: 'My Contacts',
    category: 'Contacts',
    chartType: 'number',
    icon: '👤',
    description: 'Contacts assigned to the logged-in user',
    defaultSize: 'sm',
    compute: (d) => ({
      kind: 'number',
      value: d.contacts.filter((c) => c.assigned_to === d.dealerId).length,
      sub: 'assigned to you',
    }),
  },

  /* ------------------- LEADS (dealer) ------------------- */
  {
    id: 'leads-total',
    title: 'Total Leads Assigned',
    category: 'Opportunities',
    chartType: 'number',
    icon: '🎯',
    description: 'Leads assigned to dealers',
    defaultSize: 'sm',
    compute: (d) => {
      // Admins see the total lead count alongside the assigned leads; dealers
      // and followers only ever see their own assigned leads (never the total).
      if (d.isOwner) {
        const assigned = d.dealers.reduce((s, x) => s + x.total, 0);
        const totalLeads = d.contacts.filter((c) => c.is_lead === 1 || c.contact_type === 'Lead').length;
        return { kind: 'number', value: `${assigned} / ${totalLeads}`, sub: 'assigned / total leads' };
      }
      return { kind: 'number', value: d.dealerLeads.length, sub: 'your assigned leads' };
    },
  },
  {
    id: 'leads-unassigned',
    title: 'Unassigned Leads',
    category: 'Opportunities',
    chartType: 'number',
    icon: '🚀',
    description: 'Leads not yet assigned to any dealer',
    defaultSize: 'sm',
    compute: (d) => ({ kind: 'number', value: d.unassigned, sub: 'waiting for assignment' }),
  },
  {
    id: 'leads-customers',
    title: 'Customers (bought)',
    category: 'Opportunities',
    chartType: 'number',
    icon: '🏆',
    description: 'Leads that converted to customers',
    defaultSize: 'sm',
    compute: (d) => {
      const items = d.isOwner
        ? d.dealers.flatMap((x) => Array.from({ length: x.customer }, () => ({ status: 'customer' as const })))
        : d.dealerLeads;
      const counts = statusBreakdown(items as DealerLead[]);
      return { kind: 'number', value: counts.customer, sub: 'converted to customer' };
    },
  },
  {
    id: 'leads-status-donut',
    title: 'Leads by Status',
    category: 'Opportunities',
    chartType: 'donut',
    icon: '🍩',
    description: 'Lead pipeline by current status',
    defaultSize: 'md',
    compute: (d) => {
      const items = d.isOwner
        ? d.dealers.flatMap((x) =>
            (['non_contacted', 'contacted', 'closed', 'customer', 'rejected'] as const).map((s) => ({
              status: s,
              count: x[s],
            }))
          )
        : d.dealerLeads.map((l) => ({ status: l.status, count: 1 }));
      const map = new Map<string, number>();
      for (const it of items) map.set(it.status, (map.get(it.status) ?? 0) + it.count);
      const labels = ALL_STATUSES
        .filter((s) => map.has(s) && (map.get(s) ?? 0) > 0)
        .map((s) => STATUS_META[s].label);
      const values = ALL_STATUSES
        .filter((s) => map.has(s) && (map.get(s) ?? 0) > 0)
        .map((s) => map.get(s) ?? 0);
      return { kind: 'donut', labels, values, colors: ALL_STATUSES.map((s) => STATUS_COLORS[s]) };
    },
  },
  {
    id: 'leads-status-bar',
    title: 'Leads by Status (Bar)',
    category: 'Opportunities',
    chartType: 'bar',
    icon: '📊',
    description: 'Lead pipeline by current status as bars',
    defaultSize: 'md',
    compute: (d) => {
      const items = d.isOwner
        ? d.dealers.flatMap((x) =>
            (['non_contacted', 'contacted', 'closed', 'customer', 'rejected'] as const).map((s) => ({
              status: s,
              count: x[s],
            }))
          )
        : d.dealerLeads.map((l) => ({ status: l.status, count: 1 }));
      const map = new Map<string, number>();
      for (const it of items) map.set(it.status, (map.get(it.status) ?? 0) + it.count);
      return {
        kind: 'bar',
        labels: ALL_STATUSES.map((s) => STATUS_META[s].label),
        values: ALL_STATUSES.map((s) => map.get(s) ?? 0),
        colors: ALL_STATUSES.map((s) => STATUS_COLORS[s]),
      };
    },
  },
  {
    id: 'leads-funnel',
    title: 'Lead Funnel',
    category: 'Opportunities',
    chartType: 'funnel',
    icon: '🔻',
    description: 'Lead conversion funnel through the pipeline',
    defaultSize: 'md',
    compute: (d) => {
      const counts = d.isOwner
        ? (() => {
            const map: Record<string, number> = {
              non_contacted: 0,
              contacted: 0,
              closed: 0,
              customer: 0,
            };
            for (const x of d.dealers) {
              map.non_contacted += x.non_contacted;
              map.contacted += x.contacted;
              map.closed += x.closed;
              map.customer += x.customer;
            }
            return map;
          })()
        : statusBreakdown(d.dealerLeads);
      return {
        kind: 'funnel',
        stages: STATUS_STAGES.map((s) => ({
          label: STATUS_META[s].label,
          value: counts[s],
          color: STATUS_COLORS[s],
        })),
      };
    },
  },
  {
    id: 'leads-by-dealer',
    title: 'Leads by Dealer',
    category: 'Opportunities',
    chartType: 'bar',
    icon: '🏪',
    description: 'Assigned leads per dealer',
    defaultSize: 'md',
    horizontal: true,
    compute: (d) => ({
      kind: 'bar',
      labels: d.dealers.map((x) => x.full_name),
      values: d.dealers.map((x) => x.total),
      colors: CONTACT_PALETTE,
      horizontal: true,
    }),
  },
  {
    id: 'leads-created-line',
    title: 'Leads Over Time',
    category: 'Opportunities',
    chartType: 'line',
    icon: '📉',
    description: 'Leads created over the last 6 months',
    defaultSize: 'md',
    compute: (d) => {
      const { labels, values } = byMonth(d.isOwner ? d.contacts : d.dealerLeads);
      return { kind: 'line', labels, values };
    },
  },
  {
    id: 'leads-dealers-table',
    title: 'Dealer Performance',
    category: 'Opportunities',
    chartType: 'table',
    icon: '🪩',
    description: 'Every dealer with their lead pipeline counts',
    defaultSize: 'lg',
    compute: (d) => ({
      kind: 'table',
      columns: ['Dealer', 'Total', 'Non-Contacted', 'Contacted', 'Closed', 'Customer', 'Rejected'],
      rows: d.dealers.map((x) => [
        x.full_name,
        x.total,
        x.non_contacted,
        x.contacted,
        x.closed,
        x.customer,
        x.rejected,
      ]),
    }),
  },
  {
    id: 'leads-my-table',
    title: 'My Leads',
    category: 'Opportunities',
    chartType: 'table',
    icon: '📋',
    description: 'Your assigned leads — update their status right from the dashboard',
    defaultSize: 'lg',
    compute: (d) => ({
      kind: 'lead-list',
      leads: d.dealerLeads.map((l) => ({
        contactId: l.contact_id,
        name: l.name,
        phone: l.phone,
        status: l.status,
      })),
    }),
  },
  {
    id: 'leads-stage-list',
    title: 'Lead Stages',
    category: 'Opportunities',
    chartType: 'table',
    icon: '🪜',
    description: 'Every lead and its current pipeline stage',
    defaultSize: 'lg',
    compute: (d) => ({
      kind: 'stage-list',
      leads: d.dealerLeads.map((l) => ({
        contactId: l.contact_id,
        name: l.name,
        phone: l.phone,
        status: l.status,
      })),
    }),
  },

  /* ------------------- OPPORTUNITIES (mockup-exact charts) ------------------- */
  {
    id: 'opp-status-donut',
    title: 'Opportunity Status',
    category: 'Opportunities',
    chartType: 'donut',
    icon: '🍩',
    description: 'Lead pipeline as Open / Won / Lost donut',
    defaultSize: 'md',
    compute: (d) => {
      const items = d.isOwner
        ? d.dealers.flatMap((x) =>
            (['non_contacted', 'contacted', 'closed', 'customer', 'rejected'] as const).map((s) => ({
              status: s,
              count: x[s],
            }))
          )
        : d.dealerLeads.map((l) => ({ status: l.status, count: 1 }));
      const map = new Map<string, number>();
      for (const it of items) map.set(it.status, (map.get(it.status) ?? 0) + it.count);
      const open = (map.get('non_contacted') ?? 0) + (map.get('contacted') ?? 0);
      const won = (map.get('closed') ?? 0) + (map.get('customer') ?? 0);
      const lost = map.get('rejected') ?? 0;
      return {
        kind: 'donut',
        labels: ['Open', 'Won', 'Lost'],
        values: [open, won, lost],
        colors: ['#3b82f6', '#2dd4bf', '#a855f7'],
      };
    },
  },
  {
    id: 'opp-value-bar',
    title: 'Opportunity Value',
    category: 'Opportunities',
    chartType: 'bar',
    icon: '📊',
    description: 'Open / Won / Lost lead volume as horizontal bars',
    defaultSize: 'md',
    horizontal: true,
    compute: (d) => {
      const items = d.isOwner
        ? d.dealers.flatMap((x) =>
            (['non_contacted', 'contacted', 'closed', 'customer', 'rejected'] as const).map((s) => ({
              status: s,
              count: x[s],
            }))
          )
        : d.dealerLeads.map((l) => ({ status: l.status, count: 1 }));
      const map = new Map<string, number>();
      for (const it of items) map.set(it.status, (map.get(it.status) ?? 0) + it.count);
      const open = (map.get('non_contacted') ?? 0) + (map.get('contacted') ?? 0);
      const won = (map.get('closed') ?? 0) + (map.get('customer') ?? 0);
      const lost = map.get('rejected') ?? 0;
      return {
        kind: 'bar',
        labels: ['Open', 'Won', 'Lost'],
        values: [open, won, lost],
        colors: ['#3b82f6', '#2dd4bf', '#a855f7'],
        horizontal: true,
      };
    },
  },
  {
    id: 'opp-conversion-rate',
    title: 'Conversion Rate',
    category: 'Opportunities',
    chartType: 'donut',
    icon: '🎯',
    description: 'Converted leads vs total as a gauge',
    defaultSize: 'md',
    compute: (d) => {
      const items = d.isOwner
        ? d.dealers.flatMap((x) =>
            (['non_contacted', 'contacted', 'closed', 'customer', 'rejected'] as const).map((s) => ({
              status: s,
              count: x[s],
            }))
          )
        : d.dealerLeads.map((l) => ({ status: l.status, count: 1 }));
      const map = new Map<string, number>();
      for (const it of items) map.set(it.status, (map.get(it.status) ?? 0) + it.count);
      const won = (map.get('closed') ?? 0) + (map.get('customer') ?? 0);
      const total = [...map.values()].reduce((s, v) => s + v, 0);
      const pct = total > 0 ? Math.round((won / total) * 100) : 0;
      return {
        kind: 'donut',
        labels: ['Won', 'Remaining'],
        values: [won, Math.max(0, total - won)],
        colors: ['#3b82f6', '#e2e8f0'],
        centerText: `${pct}%`,
        cutout: '80%',
      };
    },
  },
  {
    id: 'opp-stage-dist',
    title: 'Stage Distribution',
    category: 'Opportunities',
    chartType: 'donut',
    icon: '🔵',
    description: 'Lead pipeline stage distribution ring',
    defaultSize: 'md',
    compute: (d) => {
      const items = d.isOwner
        ? d.dealers.flatMap((x) =>
            (['non_contacted', 'contacted', 'closed', 'customer', 'rejected'] as const).map((s) => ({
              status: s,
              count: x[s],
            }))
          )
        : d.dealerLeads.map((l) => ({ status: l.status, count: 1 }));
      const map = new Map<string, number>();
      for (const it of items) map.set(it.status, (map.get(it.status) ?? 0) + it.count);
      return {
        kind: 'donut',
        labels: ['Non-Contacted', 'Contacted', 'Closed', 'Customer'],
        values: [0, 1, 2, 3].map((i) => {
          const s = (['non_contacted', 'contacted', 'closed', 'customer'] as const)[i];
          return map.get(s) ?? 0;
        }),
        colors: ['#3b82f6', '#2dd4bf', '#a855f7', '#6366f1'],
      };
    },
  },
  {
    id: 'traffic-analytics',
    title: 'Traffic Analytics',
    category: 'Opportunities',
    chartType: 'line',
    icon: '📈',
    description: 'Lead/contact growth over the last 6 months',
    defaultSize: 'lg',
    compute: (d) => {
      const { labels, values } = byMonth(d.isOwner ? d.contacts : d.dealerLeads);
      return { kind: 'line', labels, values };
    },
  },

  /* ------------------- APPOINTMENTS ------------------- */
  {
    id: 'appointments-booked',
    title: 'Booked Appointments',
    category: 'Appointments',
    chartType: 'number',
    icon: '📅',
    description: 'Total appointments booked',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'no appointments yet' }),
  },

  /* ------------------- VISITOR DATA ------------------- */
  {
    id: 'visitors-live',
    title: 'Live Web Visitors',
    category: 'Visitor data',
    chartType: 'number',
    icon: '🌐',
    description: 'Visitors currently on your site',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'live visitors' }),
  },

  /* ------------------- EMAILS ------------------- */
  {
    id: 'emails-sent',
    title: 'Emails Sent',
    category: 'Emails',
    chartType: 'number',
    icon: '📧',
    description: 'Emails sent to contacts',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'emails sent' }),
  },
  {
    id: 'emails-opened',
    title: 'Emails Opened',
    category: 'Emails',
    chartType: 'number',
    icon: '👁️',
    description: 'Emails opened by contacts',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'emails opened' }),
  },

  /* ------------------- SMS ------------------- */
  {
    id: 'sms-sent',
    title: 'SMS Sent',
    category: 'SMS',
    chartType: 'number',
    icon: '💬',
    description: 'SMS messages sent',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'messages sent' }),
  },

  /* ------------------- CALLS ------------------- */
  {
    id: 'calls-total',
    title: 'Total Calls',
    category: 'Calls',
    chartType: 'number',
    icon: '📞',
    description: 'Total inbound & outbound calls',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'calls made' }),
  },
  {
    id: 'calls-missed',
    title: 'Missed Calls',
    category: 'Calls',
    chartType: 'number',
    icon: '🚫',
    description: 'Calls that were missed',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'missed calls' }),
  },

  /* ------------------- CONVERSATIONS ------------------- */
  {
    id: 'conversations-open',
    title: 'Open Conversations',
    category: 'Conversations',
    chartType: 'number',
    icon: '💬',
    description: 'Active conversations with contacts',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'open chats' }),
  },

  /* ------------------- PAYMENTS ------------------- */
  {
    id: 'payments-total',
    title: 'Total Payments',
    category: 'Payments',
    chartType: 'number',
    icon: '💳',
    description: 'Total payments collected',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 'Rs 0', sub: 'total collected' }),
  },

  /* ------------------- META ADS ------------------- */
  {
    id: 'meta-ads-spend',
    title: 'Meta Ads Spend',
    category: 'Meta Ads',
    chartType: 'number',
    icon: '📢',
    description: 'Total spend on Meta ad campaigns',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 'Rs 0', sub: 'total spend' }),
  },

  /* ------------------- GOOGLE ADS ------------------- */
  {
    id: 'google-ads-spend',
    title: 'Google Ads Spend',
    category: 'Google Ads',
    chartType: 'number',
    icon: '🔍',
    description: 'Total spend on Google ad campaigns',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 'Rs 0', sub: 'total spend' }),
  },

  /* ------------------- SOCIAL PLANNER ------------------- */
  {
    id: 'social-posts-scheduled',
    title: 'Scheduled Posts',
    category: 'Social Planner',
    chartType: 'number',
    icon: '📱',
    description: 'Posts scheduled on social channels',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'posts scheduled' }),
  },

  /* ------------------- GENERAL ------------------- */
  {
    id: 'general-activity',
    title: 'Recent Activity',
    category: 'General',
    chartType: 'table',
    icon: '⚡',
    description: 'Recent contact activity in the CRM',
    defaultSize: 'md',
    compute: (d) => ({
      kind: 'table',
      columns: ['Contact', 'Type', 'Created'],
      rows: d.contacts
        .slice()
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .slice(0, 6)
        .map((c) => [fmtName(c), c.contact_type || 'Other', c.created_at ? c.created_at.slice(0, 10) : '—']),
    }),
  },

  /* ------------------- GOOGLE ANALYTICS ------------------- */
  {
    id: 'ga-visitors',
    title: 'Total Views',
    category: 'Google Analytics',
    chartType: 'number',
    icon: '📊',
    description: 'Total website views',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'total views' }),
  },
  {
    id: 'ga-sessions',
    title: 'Direct Sessions',
    category: 'Google Analytics',
    chartType: 'number',
    icon: '🖥️',
    description: 'Direct website sessions',
    defaultSize: 'sm',
    compute: () => ({ kind: 'number', value: 0, sub: 'direct sessions' }),
  },
];

export const WIDGET_BY_ID: Record<string, WidgetDef> = Object.fromEntries(
  WIDGET_DEFS.map((w) => [w.id, w])
);

export const CHART_TYPE_LABELS: Record<WidgetChartType, string> = {
  number: 'Number',
  donut: 'Donut',
  line: 'Line',
  bar: 'Bar',
  funnel: 'Funnel',
  table: 'Table',
};

export const DEFAULT_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

interface SeriesShape {
  labels: string[];
  values: number[];
  colors?: string[];
  horizontal?: boolean;
}

/** Extract a labels/values series from any chart-like widget data. */
function seriesOf(data: WidgetData): SeriesShape | null {
  if (data.kind === 'donut') return { labels: data.labels, values: data.values, colors: data.colors };
  if (data.kind === 'line') return { labels: data.labels, values: data.values };
  if (data.kind === 'bar')
    return { labels: data.labels, values: data.values, colors: data.colors, horizontal: data.horizontal };
  if (data.kind === 'funnel')
    return {
      labels: data.stages.map((s) => s.label),
      values: data.stages.map((s) => s.value),
      colors: data.stages.map((s) => s.color),
    };
  return null;
}

function toStages(labels: string[], values: number[], palette: string[]) {
  return labels.map((label, i) => ({
    label,
    value: values[i] ?? 0,
    color: palette[i % palette.length] ?? DEFAULT_PALETTE[0],
  }));
}

/** Which display modes make sense for a widget given the shape of its data. */
export function allowedDisplays(data: WidgetData): WidgetChartType[] {
  switch (data.kind) {
    case 'number':
      return ['number'];
    case 'table':
    case 'stage-list':
    case 'lead-list':
      return ['table'];
    default:
      return ['number', 'donut', 'line', 'bar', 'funnel'];
  }
}

/** The display mode that will actually be rendered for the given settings. */
export function resolveDisplay(data: WidgetData, s?: WidgetSettings): WidgetChartType {
  const requested = s?.display ?? 'auto';
  if (requested !== 'auto') return requested;
  switch (data.kind) {
    case 'donut':
    case 'line':
    case 'bar':
    case 'funnel':
      return data.kind;
    case 'number':
      return 'number';
    default:
      return 'table';
  }
}

/**
 * Apply user-configured appearance settings to a widget's native data —
 * converting between display modes (donut ↔ bar ↔ line ↔ funnel ↔ number)
 * and overriding colours / chart options where requested.
 */
export function applyWidgetSettings(data: WidgetData, s?: WidgetSettings): WidgetData {
  if (!s) return data;
  const pal = s.palette && s.palette.length > 0 ? s.palette : undefined;
  const series = seriesOf(data);

  // Tables and lead lists can only render as tables.
  if (!series) {
    if ((data.kind === 'stage-list' || data.kind === 'lead-list') && s.display === 'table') {
      return {
        kind: 'table',
        columns: ['Lead', 'Stage'],
        rows: data.leads.map((l) => [l.name, STATUS_META[l.status].label]),
      };
    }
    return data;
  }

  const effColors = pal ?? series.colors;

  // 'auto': keep the native chart type, only honour colour/option overrides.
  if (s.display === undefined || s.display === 'auto') {
    if (!pal && !s.cutout && s.horizontal === undefined && s.fillArea === undefined) return data;
    switch (data.kind) {
      case 'donut':
        return { ...data, ...(pal ? { colors: pal } : {}), ...(s.cutout ? { cutout: s.cutout } : {}) };
      case 'bar':
        return { ...data, ...(pal ? { colors: pal } : {}), ...(s.horizontal !== undefined ? { horizontal: s.horizontal } : {}) };
      case 'line':
        return {
          ...data,
          ...(effColors && effColors[0] ? { color: effColors[0] } : {}),
          ...(s.fillArea !== undefined ? { fill: s.fillArea } : {}),
        };
      case 'funnel':
        return pal ? { kind: 'funnel', stages: toStages(series.labels, series.values, pal) } : data;
      default:
        return data;
    }
  }

  // Explicit display override: convert the series into the requested shape.
  switch (s.display) {
    case 'number':
      return { kind: 'number', value: series.values.reduce((a, b) => a + b, 0), sub: 'total' };
    case 'donut':
      return {
        kind: 'donut',
        labels: series.labels,
        values: series.values,
        ...(effColors ? { colors: effColors } : {}),
        ...(s.cutout ? { cutout: s.cutout } : {}),
      };
    case 'line':
      return {
        kind: 'line',
        labels: series.labels,
        values: series.values,
        color: effColors && effColors[0] ? effColors[0] : undefined,
        fill: s.fillArea ?? true,
      };
    case 'bar':
      return {
        kind: 'bar',
        labels: series.labels,
        values: series.values,
        ...(effColors ? { colors: effColors } : {}),
        horizontal: s.horizontal ?? series.horizontal ?? false,
      };
    case 'funnel':
      return { kind: 'funnel', stages: toStages(series.labels, series.values, effColors ?? DEFAULT_PALETTE) };
    case 'table':
      return {
        kind: 'table',
        columns: ['Label', 'Value'],
        rows: series.labels.map((l, i) => [l, series.values[i] ?? 0]),
      };
  }
}

/**
 * Widgets that Dealers and Followers can use. These all derive from the
 * signed-in user's own lead pipeline (dealerLeads / their dealer's leads)
 * so they never expose global CRM data like total contacts, emails or ads.
 */
const TEAM_WIDGET_IDS = new Set([
  'contacts-mine',
  'leads-total',
  'leads-customers',
  'leads-status-donut',
  'leads-status-bar',
  'leads-funnel',
  'leads-created-line',
  'leads-my-table',
  'leads-stage-list',
  'opp-status-donut',
  'opp-value-bar',
  'opp-conversion-rate',
  'opp-stage-dist',
  'traffic-analytics',
]);

/** Widgets visible to a role: Admins see everything, Dealers/Followers see only their own leads. */
export function filterDefsForRole(defs: WidgetDef[], role: WidgetRole): WidgetDef[] {
  if (role === 'Admin') return defs;
  return defs.filter((w) => TEAM_WIDGET_IDS.has(w.id));
}

/** True when a single widget def id may be shown to the given role. */
export function isWidgetAllowedForRole(defId: string, role: WidgetRole): boolean {
  return filterDefsForRole(WIDGET_DEFS, role).some((w) => w.id === defId);
}

const ADMIN_DEFAULT_INSTANCES: WidgetInstance[] = [
  { uid: 'd1', defId: 'leads-total', title: 'Total Leads', size: 'sm' },
  { uid: 'd2', defId: 'contacts-with-email', title: 'Contacts with Email', size: 'sm' },
  { uid: 'd3', defId: 'contacts-total', title: 'Total Contacts', size: 'sm' },
  { uid: 'd4', defId: 'contacts-with-phone', title: 'Contacts with Phone', size: 'sm' },
  { uid: 'd5', defId: 'contacts-mine', title: 'My Leads', size: 'md' },
  { uid: 'd6', defId: 'contacts-recent', title: 'Recent Contacts', size: 'md' },
  { uid: 'd7', defId: 'leads-funnel', title: 'Lead Funnel', size: 'md' },
  { uid: 'd8', defId: 'contacts-by-type', title: 'Contact By Type', size: 'md' },
];

const TEAM_DEFAULT_INSTANCES: WidgetInstance[] = [
  { uid: 'd1', defId: 'leads-total', title: 'Total Leads Assigned', size: 'sm' },
  { uid: 'd2', defId: 'leads-customers', title: 'Customers (Bought)', size: 'sm' },
  { uid: 'd3', defId: 'leads-status-donut', title: 'Leads by Status', size: 'md' },
  { uid: 'd4', defId: 'leads-my-table', title: 'My Leads', size: 'lg' },
  { uid: 'd5', defId: 'leads-funnel', title: 'Lead Funnel', size: 'md' },
  { uid: 'd6', defId: 'leads-created-line', title: 'Leads Over Time', size: 'md' },
  { uid: 'd7', defId: 'leads-stage-list', title: 'Lead Stages', size: 'lg' },
  { uid: 'd8', defId: 'traffic-analytics', title: 'Traffic Analytics', size: 'lg' },
];

/** The widgets a role starts with on a fresh dashboard. */
export function defaultInstancesForRole(role: WidgetRole): WidgetInstance[] {
  return role === 'Admin' ? ADMIN_DEFAULT_INSTANCES : TEAM_DEFAULT_INSTANCES;
}