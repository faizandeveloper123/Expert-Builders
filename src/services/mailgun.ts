/**
 * ============================================================================
 *  MAILGUN INTEGRATION — PLACEHOLDER
 * ============================================================================
 *  This file centralises ALL outbound/inbound email logic so that Mailgun can
 *  be connected by replacing the placeholder values below with real
 *  credentials. Nothing here sends real mail yet.
 *
 *  HOW TO ACTIVATE MAILGUN
 *  -----------------------
 *  1. Create an account at https://www.mailgun.com and add/verify your domain.
 *  2. Copy your private API key (e.g. `key-1234abcd...`) from the Mailgun
 *     dashboard.
 *  3. Replace every `YOUR_*` placeholder below with the real value.
 *  4. For INBOUND email, add the Mailgun HTTP webhook URL to your domain:
 *       http://localhost/Yadea/api/mailgun-webhook.php
 *     (or the public URL you host the app on) and route messages to it.
 *
 *  The REST API is documented here: https://documentation.mailgun.com
 * ============================================================================
 */

import type { SelectOption } from '../components/SearchableSelect';

export interface MailgunConfig {
  /** Verified Mailgun domain, e.g. "mail.yourcompany.com" */
  DOMAIN: string;
  /** Mailgun private API key, e.g. "key-xxxxxxxxxxxxxxxxxxxxxxxx" */
  API_KEY: string;
  /** Region endpoint: "https://api.mailgun.net/v3" or "https://api.eu.mailgun.net/v3" */
  API_BASE: string;
  /** Default sender (used when no staff assignment exists). */
  FROM_EMAIL: string;
  FROM_NAME: string;
}

/**
 * TODO: Replace these placeholders with real Mailgun credentials when ready.
 * Keep this file OUT of git history / never commit real keys.
 */
export const MAILGUN_CONFIG: MailgunConfig = {
  DOMAIN: 'YOUR_MAILGUN_DOMAIN', // e.g. 'mg.yourcompany.com'
  API_KEY: 'YOUR_MAILGUN_API_KEY', // e.g. 'key-xxxxxxxxxxxxxxxxxxxxxxxx'
  API_BASE: 'https://api.mailgun.net/v3',
  FROM_EMAIL: 'YOUR_FROM_EMAIL', // e.g. 'crm@yourcompany.com'
  FROM_NAME: 'YOUR_FROM_NAME', // e.g. 'Evee CRM'
};

export interface EmailPayload {
  fromEmail: string;
  fromName?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: string[];
  templateVariables?: Record<string, string>;
}

export interface EmailReceipt {
  id: string | null;
  status: 'sent' | 'queued' | 'failed';
  provider: 'mailgun' | 'mock';
  messageId: string | null;
}

export const isMailgunConfigured = (): boolean =>
  !MAILGUN_CONFIG.DOMAIN.startsWith('YOUR_') && !MAILGUN_CONFIG.API_KEY.startsWith('YOUR_');

const authHeader = (): string =>
  'Basic ' + btoa(`api:${MAILGUN_CONFIG.API_KEY}`);

/**
 * SEND EMAIL — Mailgun placeholder.
 * When configured (see MAILGUN_CONFIG), this POSTs to the Mailgun Messages
 * endpoint. Until then it only logs to the console and returns a mock receipt,
 * so the rest of the UI keeps working.
 */
export async function sendEmailViaMailgun(payload: EmailPayload): Promise<EmailReceipt> {
  if (!isMailgunConfigured()) {
    // eslint-disable-next-line no-console
    console.log('[Mailgun placeholder] Email payload (not sent):', payload);
    return { id: null, status: 'queued', provider: 'mock', messageId: null };
  }

  const form = new FormData();
  form.append('from', `${payload.fromName || MAILGUN_CONFIG.FROM_NAME} <${payload.fromEmail || MAILGUN_CONFIG.FROM_EMAIL}>`);
  form.append('to', payload.to);
  if (payload.cc) form.append('cc', payload.cc);
  if (payload.bcc) form.append('bcc', payload.bcc);
  form.append('subject', payload.subject);
  form.append('html', payload.html);
  form.append('text', payload.text || '');
  for (const [key, value] of Object.entries(payload.templateVariables ?? {})) {
    form.append(`v:${key}`, value);
  }

  const res = await fetch(`${MAILGUN_CONFIG.API_BASE}/${MAILGUN_CONFIG.DOMAIN}/messages`, {
    method: 'POST',
    headers: { Authorization: authHeader() },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mailgun send failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { id: string | null; message?: string };
  return { id: data.id, status: 'sent', provider: 'mailgun', messageId: data.id };
}

/**
 * RECEIVE EMAIL — Mailgun webhook placeholder.
 * Mailgun posts inbound messages to api/mailgun-webhook.php. This function
 * parses that payload into the CRM-friendly shape. Replace/extend the body to
 * save the message against a contact once real credentials are wired up.
 */
export function parseInboundEmail(payload: unknown): {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  timestamp?: number;
} {
  const p = (payload ?? {}) as Record<string, string | number | undefined>;
  return {
    from: String(p.From ?? p.from ?? ''),
    to: String(p.To ?? p.to ?? ''),
    cc: String(p.Cc ?? '') || undefined,
    subject: String(p.Subject ?? p.subject ?? ''),
    body: String(p['body-plain'] ?? p.body ?? ''),
    timestamp: p['Timestamp'] ? Number(p['Timestamp']) : undefined,
  };
}

/**
 * Convenience list used by any "choose an email" / domain dropdown that the
 * Mailgun integration might drive (e.g. picking a sending domain).
 */
export const MAILGUN_DOMAIN_OPTIONS: SelectOption[] = [
  { value: MAILGUN_CONFIG.DOMAIN, label: MAILGUN_CONFIG.DOMAIN },
  { value: 'YOUR_SECOND_MAILGUN_DOMAIN', label: 'YOUR_SECOND_MAILGUN_DOMAIN' },
];