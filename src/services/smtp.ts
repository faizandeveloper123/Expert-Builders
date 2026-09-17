/**
 * ============================================================================
 *  SMTP EMAIL SERVICE — CRM outbound mail (cPanel webmail)
 * ============================================================================
 *  Sends real email through the CRM's own mailbox via the PHP backend
 *  (api/index.php -> /emails/send), which uses PHPMailer + SMTP.
 *
 *  Server config lives in api/mail_config.php:
 *    HOST mail.yadea.com.pk : 465 (SSL) — user crm@yadea.com.pk
 * ============================================================================
 */

export const SMTP_FROM_EMAIL = 'crm@yadea.com.pk';
export const SMTP_FROM_NAME = 'Expert Builders & Developers';

/**
 * Same-origin API base, auto-detecting the app's sub-directory.
 * Derives the path from the current URL so it works regardless of the
 * deployment folder name (e.g. /expert-builders/, /expert-builders-dev/, or root /).
 */
function detectApiBases(): string[] {
  const path = window.location.pathname;
  const dir = path.substring(0, path.lastIndexOf('/') + 1);
  const bases = [`${dir}api/index.php`, '/api/index.php'];
  return [...new Set(bases)];
}

let workingBase: string | null = null;

async function post<T>(path: string, body: unknown): Promise<T> {
  const bases = Array.from(new Set([workingBase].concat(detectApiBases()).filter(Boolean) as string[]));

  let lastErr: Error | null = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let payload: unknown = null;
      let parseFailed = false;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          parseFailed = true;
        }
      }

      if (res.ok) {
        // 2xx carrying HTML (SPA fallback) means we did not reach the API.
        if (parseFailed && text.trim().length > 0) {
          lastErr = new Error(`Non-JSON response from ${base}${path} (HTTP ${res.status})`);
          continue;
        }
        workingBase = base;
        return payload as T;
      }

      if (payload !== null) {
        const msg = (payload as { error?: string })?.error ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }

      lastErr = new Error(`Invalid JSON from ${base}${path} (HTTP ${res.status})`);
    } catch (err) {
      lastErr = err as Error;
    }
  }

  throw lastErr ?? new Error(`Unable to reach the CRM API from ${window.location.origin}`);
}

export interface SmtpSendResult {
  sent_count: number;
  failed_count: number;
  sent: string[];
  failed: Record<string, string>;
}

/** Send one composed message to many recipients (sent individually). */
export async function sendSmtpEmail(opts: {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  fromName?: string;
}): Promise<SmtpSendResult> {
  const res = await post<{ data: SmtpSendResult }>('/emails/send', {
    to: opts.to,
    cc: opts.cc,
    bcc: opts.bcc,
    subject: opts.subject,
    html: opts.html,
    from_name: opts.fromName ?? SMTP_FROM_NAME,
  });
  return res.data;
}

/** Deliverability check — sends a small test message to one address. */
export async function sendSmtpTestEmail(to: string): Promise<void> {
  await post('/emails/test', { to });
}
