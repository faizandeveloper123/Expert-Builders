<?php
/**
 * EXPERT BUILDERS CRM - SMTP / mail configuration
 *
 * Fill in the values below (or set the matching environment variables).
 * When SMTP_HOST is empty the API falls back to PHP's mail() so nothing
 * breaks before credentials are added.
 *
 * Credentials you need from your email provider:
 *   1. SMTP HOST      e.g. smtp.gmail.com, smtp.hostinger.com, mail.yourdomain.com
 *   2. SMTP PORT      465 (SSL) or 587 (TLS/STARTTLS)
 *   3. ENCRYPTION     'ssl' for port 465, 'tls' for port 587
 *   4. USERNAME       the full email address used to send (e.g. no-reply@yourdomain.com)
 *   5. PASSWORD       the mailbox password (for Gmail: an App Password,
 *                     generated at https://myaccount.google.com/apppasswords)
 *   6. FROM NAME      display name shown in the inbox (e.g. "Expert Builders & Developers")
 *
 * Anti-spam notes:
 *   - Always use a real mailbox on YOUR domain as the sender.
 *   - Make sure your domain's DNS has an SPF record that includes your SMTP
 *     provider, and enable DKIM in the provider panel when available.
 *
 * APP_URL is used for login links inside emails (no trailing slash).
 */

define('SMTP_HOST', getenv('SMTP_HOST') ?: 'mail.yadea.com.pk'); // cPanel mailbox host
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 465));    // 465 SSL (cPanel) or 587 TLS
define('SMTP_SECURE', getenv('SMTP_SECURE') ?: 'ssl');     // 'ssl' | 'tls' | ''
define('SMTP_USER', getenv('SMTP_USER') ?: 'crm@yadea.com.pk'); // sender mailbox

// The mailbox password is NEVER committed. It lives in api/mail_secrets.php
// (gitignored, local + server only) or the SMTP_PASS environment variable.
if (is_file(__DIR__ . '/mail_secrets.php')) {
    require_once __DIR__ . '/mail_secrets.php';
}
if (!defined('SMTP_PASS')) {
    define('SMTP_PASS', (string)getenv('SMTP_PASS')); // empty until secrets are provided
}

define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Expert Builders & Developers');

/** Public site URL used in email links (no trailing slash). */
define('APP_URL', getenv('APP_URL') ?: 'https://agency.hifimarketing.co');
