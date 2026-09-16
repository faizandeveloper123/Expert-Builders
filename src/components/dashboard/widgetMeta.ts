import type { DealerLeadStatus } from '../../api';

export const STATUS_META: Record<DealerLeadStatus, { label: string }> = {
  non_contacted: { label: 'Non-Contacted' },
  contacted: { label: 'Contacted' },
  closed: { label: 'Closed' },
  customer: { label: 'Customer' },
  rejected: { label: 'Rejected' },
};

export const STATUS_COLORS: Record<DealerLeadStatus, string> = {
  non_contacted: '#94a3b8',
  contacted: '#3b82f6',
  closed: '#f59e0b',
  customer: '#10b981',
  rejected: '#ef4444',
};