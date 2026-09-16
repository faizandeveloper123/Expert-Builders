import { useSyncExternalStore } from 'react';

export type BulkActionStatus = 'Complete' | 'Processing' | 'Paused' | 'Cancelled' | 'Queued';

export interface BulkActionEntry {
  id: number;
  /** Human-friendly name shown in the "Action label" column. */
  label: string;
  /** Operation key shown in the "Operation" column (matches filter options). */
  operation: string;
  status: BulkActionStatus;
  user: string;
  userInitials: string;
  createdAt: number;
  stats: 'chart' | 'download';
}

const STORAGE_KEY = 'evee_bulk_actions';

const SEED_ENTRIES: BulkActionEntry[] = [
  {
    id: 1,
    label: 'fd',
    operation: 'Add tag',
    status: 'Complete',
    user: 'Asad B Zaman',
    userInitials: 'AB',
    createdAt: new Date(2026, 7, 15, 12, 4).getTime(),
    stats: 'chart',
  },
  {
    id: 2,
    label: 'hk',
    operation: 'Add tag',
    status: 'Complete',
    user: 'Asad B Zaman',
    userInitials: 'AB',
    createdAt: new Date(2026, 7, 15, 12, 1).getTime(),
    stats: 'chart',
  },
  {
    id: 3,
    label: 'Export_Contacts_All_Aug_2026_10_36_...',
    operation: 'Export',
    status: 'Complete',
    user: 'Asad B Zaman',
    userInitials: 'AB',
    createdAt: new Date(2026, 7, 15, 10, 36).getTime(),
    stats: 'download',
  },
];

function loadEntries(): { entries: BulkActionEntry[]; nextId: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BulkActionEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const maxId = Math.max(...parsed.map((e) => e.id), 0);
        return { entries: parsed, nextId: maxId + 1 };
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return { entries: SEED_ENTRIES, nextId: 4 };
}

let { entries, nextId } = loadEntries();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function logBulkAction(input: {
  label: string;
  operation: string;
  status?: BulkActionStatus;
  user?: string;
  stats?: 'chart' | 'download';
}): BulkActionEntry {
  const user = input.user ?? 'Asad B Zaman';
  const entry: BulkActionEntry = {
    id: nextId++,
    label: input.label,
    operation: input.operation,
    status: input.status ?? 'Complete',
    user,
    userInitials: initialsOf(user),
    createdAt: Date.now(),
    stats: input.stats ?? 'chart',
  };
  entries = [entry, ...entries].slice(0, 200);
  emit();
  persist();
  return entry;
}

export function getBulkActions(): BulkActionEntry[] {
  return entries;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useBulkActions(): BulkActionEntry[] {
  return useSyncExternalStore(subscribe, getBulkActions);
}
