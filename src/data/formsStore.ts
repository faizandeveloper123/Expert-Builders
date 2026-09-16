import { useSyncExternalStore } from 'react';

export interface StoredFormElement {
  label: string;
  type: string;
}

export interface StoredForm {
  id: string;
  name: string;
  elements: StoredFormElement[];
}

const STORAGE_KEY = 'evee_crm_forms';

const LEGACY_DEFAULT_IDS = new Set(['form-0', 'auto-dealer-contact-us', 'dealership-registration']);

function load(): StoredForm[] {
  let parsed: StoredForm[] | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) parsed = p as StoredForm[];
    }
  } catch {
    /* ignore malformed storage */
  }
  if (!parsed) return [];
  // Drop legacy seed/default forms (Form 0 etc.) shipped by older versions so no
  // placeholder form shows by default. Real forms registered via submissions
  // (id "form-<name>") are preserved.
  return parsed.filter((f) => !LEGACY_DEFAULT_IDS.has(f.id));
}

let forms: StoredForm[] = load();
let snapshot: StoredForm[] | null = null;
const listeners = new Set<() => void>();

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  } catch {
    /* ignore quota errors */
  }
}

function emit(): void {
  snapshot = null;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): StoredForm[] {
  if (snapshot === null) snapshot = forms;
  return snapshot;
}

export function getForms(): StoredForm[] {
  return forms;
}

/** Register (or update) a form so it appears as a dropdown in Manage Fields. */
export function upsertForm(form: StoredForm): void {
  const existing = forms.find((f) => f.name === form.name);
  if (existing) {
    forms = forms.map((f) => (f.name === form.name ? { ...f, ...form, id: f.id } : f));
  } else {
    forms = [...forms, form];
  }
  emit();
}

/** Called when a public form is submitted - records the form and its fields. */
export function recordFormSubmission(name: string, elements: { label: string; type: string }[]): void {
  const fields = elements.filter((el) => el.type !== 'button');
  if (!name || fields.length === 0) return;
  upsertForm({
    id: `form-${name}`,
    name,
    elements: fields.map((el) => ({ label: el.label, type: el.type })),
  });
}

/** Hook for components that render the form dropdowns (e.g. Manage Fields). */
export function useForms(): StoredForm[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}