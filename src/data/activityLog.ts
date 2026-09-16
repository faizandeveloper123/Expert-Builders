import { useMemo, useSyncExternalStore } from 'react';
import { api, type ApiActivity } from '../api';

export type ActivityType =
  | 'form'
  | 'email'
  | 'whatsapp'
  | 'sms'
  | 'call'
  | 'contact'
  | 'delete'
  | 'smartlist'
  | 'task'
  | 'note'
  | 'appointment'
  | 'document'
  | 'opportunity'
  | 'company'
  | 'comment'
  | 'review';

export interface ActivityEntry {
  id: number;
  type: ActivityType;
  title: string;
  detail?: string;
  createdAt: number;
  /** Optional scope: when set, the entry shows only on that contact's activity tab. */
  contactId?: number;
}

let activities: ActivityEntry[] = [];
let dbActivities: Record<number, ActivityEntry[]> = {};
let nextId = 1;
/** Negative ids identify optimistic (not-yet-persisted) contact entries. */
let tempId = -1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function logActivity(input: Omit<ActivityEntry, 'id' | 'createdAt'>): ActivityEntry {
  const entry: ActivityEntry = {
    ...input,
    id: input.contactId !== undefined ? tempId-- : nextId++,
    createdAt: Date.now(),
  };

  if (entry.contactId !== undefined) {
    // Contact-scoped entry: keep it optimistically in the per-contact store,
    // then persist and reconcile with the server's canonical list.
    const cid = entry.contactId;
    dbActivities = { ...dbActivities, [cid]: [entry, ...(dbActivities[cid] ?? [])] };
    emit();

    api
      .createActivity(cid, { type: entry.type, title: entry.title, detail: entry.detail ?? '' })
      .then(() => loadContactActivities(cid))
      .catch(() => {});
  } else {
    activities = [entry, ...activities].slice(0, 100);
    emit();
  }

  return entry;
}

/** Convert a DB activity row into an in-memory ActivityEntry. */
function fromDb(a: ApiActivity, contactId: number): ActivityEntry {
  return {
    id: a.id,
    type: (a.type as ActivityType) ?? 'contact',
    title: a.title,
    detail: a.detail ?? undefined,
    contactId,
    createdAt: new Date(a.created_at).getTime(),
  };
}

/** Load persisted activities for a contact and keep them scoped to that contact. */
export async function loadContactActivities(contactId: number): Promise<void> {
  try {
    const res = await api.listActivities(contactId);
    dbActivities = {
      ...dbActivities,
      [contactId]: res.data.map((a) => fromDb(a, contactId)),
    };
    emit();
  } catch {
    // Ignore load failures; in-memory list stays as-is.
  }
}

export function clearActivities() {
  activities = [];
  dbActivities = {};
  emit();
}

export function getActivities(): ActivityEntry[] {
  return activities;
}

/** Activities shown on a specific contact's tab: in-session scoped/global entries
 *  merged with the persisted DB entries for that contact. */
function getContactActivities(contactId: number): ActivityEntry[] {
  const merged = [
    ...(dbActivities[contactId] ?? []),
    ...activities.filter((a) => a.contactId === undefined || a.contactId === contactId),
  ].filter(
    (a, i, arr) =>
      arr.findIndex(
        (x) =>
          x.type === a.type &&
          x.title === a.title &&
          x.detail === a.detail &&
          x.createdAt === a.createdAt &&
          x.contactId === a.contactId
      ) === i
  );
  return merged.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useActivities(): ActivityEntry[] {
  return useSyncExternalStore(subscribe, getActivities);
}

export function useContactActivities(contactId: number): ActivityEntry[] {
  const store = useMemo(() => {
    let snapshot: ActivityEntry[] = [];
    return {
      subscribe,
      getSnapshot: () => {
        const next = getContactActivities(contactId);
        // useSyncExternalStore requires getSnapshot to return a stable
        // reference between notifications; only return a new array when the
        // underlying data actually changed.
        if (
          snapshot.length !== next.length ||
          snapshot.some((e, i) => e.id !== next[i]?.id || e.createdAt !== next[i]?.createdAt)
        ) {
          snapshot = next;
        }
        return snapshot;
      },
    };
  }, [contactId]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
