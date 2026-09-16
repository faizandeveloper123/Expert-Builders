import { useSyncExternalStore } from 'react';

/**
 * Lightweight store of column names coming from imported Excel files, so the
 * imported columns become available as addable table columns in Manage Fields
 * and the contacts list can show the data from the uploaded sheets.
 *
 * The column set is persisted to localStorage so it survives a page refresh
 * (a checked "import:Model" column must keep resolving to its field later).
 */
const STORAGE_KEY = 'evee_import_columns';

let importColumns: string[] = readStored();
let snapshot: string[] | null = null;
const listeners = new Set<() => void>();

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed.filter((x) => typeof x === 'string') as string[]) : [];
  } catch {
    return [];
  }
}

function emit(): void {
  snapshot = null;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): string[] {
  if (snapshot === null) snapshot = importColumns;
  return snapshot;
}

export function getImportColumns(): string[] {
  return importColumns;
}

/** Replace the set of imported columns (called after an Excel import). */
export function registerImportColumns(labels: string[]): void {
  const unique = Array.from(new Set(labels.filter((l) => !!l && l.trim()))).sort((a, b) =>
    a.localeCompare(b)
  );
  importColumns = unique;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    /* ignore storage errors */
  }
  emit();
}

/** Hook for components that render the imported-fields group. */
export function useImportColumns(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}