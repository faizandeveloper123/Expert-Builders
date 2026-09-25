export type ContactPropertyFieldType = 'text' | 'date' | 'select' | 'textarea';

export interface ContactPropertyField {
  key: string;
  label: string;
  type: ContactPropertyFieldType;
  placeholder?: string;
  options?: string[];
  full?: boolean;
}

export const CONTACT_TYPE_OPTIONS = ['Lead', 'Customer'] as const;

export const FILE_STATUS_OPTIONS = ['Active', 'Inactive'] as const;

export const contactPropertyFields: ContactPropertyField[] = [
  { key: 'registration_no', label: 'Registration number', type: 'text', placeholder: 'e.g. REG-0012' },
  { key: 'son_of', label: 'Son of', type: 'text', placeholder: "Father's name" },
  { key: 'file_no', label: 'File No', type: 'text', placeholder: 'e.g. F-1024' },
  { key: 'plot_size', label: 'Plot size', type: 'text', placeholder: 'e.g. 1 Kanal, 10 Marla' },
  { key: 'file_type', label: 'File type', type: 'text', placeholder: 'e.g. Ballot, allotment' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'House / street / city' },
  { key: 'booking_date', label: 'Booking date', type: 'date' },
  { key: 'file_status', label: 'Block / Street / File status', type: 'select', options: [...FILE_STATUS_OPTIONS] },
  { key: 'installment_no', label: 'Installment No', type: 'text', placeholder: 'e.g. 1' },
  {
    key: 'installment_description',
    label: 'Installment description',
    type: 'textarea',
    placeholder: 'Payment detail / note',
  },
];

export const contactPropertyKeys = contactPropertyFields.map((f) => f.key);

export function emptyContactProperties(): Record<string, string> {
  return contactPropertyFields.reduce<Record<string, string>>((acc, f) => {
    acc[f.key] = '';
    return acc;
  }, {});
}

export function readContactProperties(customFields?: Record<string, unknown> | null): Record<string, string> {
  const out = emptyContactProperties();
  if (!customFields) return out;
  for (const field of contactPropertyFields) {
    const raw = customFields[field.key];
    if (raw === null || raw === undefined) continue;
    if (Array.isArray(raw) || typeof raw === 'object') continue;
    out[field.key] = String(raw);
  }
  return out;
}

export function contactPropertiesPayload(values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of contactPropertyFields) {
    const value = (values[field.key] ?? '').trim();
    if (value !== '') out[field.key] = value;
  }
  return out;
}
