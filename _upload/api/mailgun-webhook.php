<?php
/**
 * ============================================================================
 *  MAILGUN INBOUND WEBHOOK — PLACEHOLDER
 * ============================================================================
 *  Mailgun will POST every inbound email to this URL once you configure the
 *  HTTP webhook in your Mailgun domain settings:
 *
 *      https://documentation.mailgun.com/docs/mailgun/user-manual/tracking-messages/#incoming-webhooks
 *
 *  To activate:
 *    1. In Mailgun Dashboard -> Sending -> Domains -> your domain -> Webhooks,
 *       add the "Incoming Email" (Received) webhook pointing to:
 *           http://localhost/Evee/api/mailgun-webhook.php
 *       (or the public URL where this project is hosted).
 *    2. Replace the MAILGUN_SIGNING_KEY placeholder below with your real
 *       Mailgun webhook signing key so messages are verified.
 *    3. Uncomment/implement the contact-matching + storage logic.
 *
 *  Mailgun sends `application/x-www-form-urlencoded` fields: From, To, Cc,
 *  Subject, body-html, body-plain, Message-Id, Timestamp, Token, Signature, etc.
 * ============================================================================
 */

declare(strict_types=1);

require __DIR__ . '/config.php';

cors();

/** Read from the MAILGUN_SIGNING_KEY env var; placeholder mode until set. */
define('MAILGUN_SIGNING_KEY', getenv('MAILGUN_SIGNING_KEY') ?: 'YOUR_MAILGUN_SIGNING_KEY');

function verify_mailgun_signature(array $data): bool
{
    if (MAILGUN_SIGNING_KEY === 'YOUR_MAILGUN_SIGNING_KEY') {
        // Placeholder mode: accept the payload so development flows work.
        return true;
    }
    $token = (string)($data['token'] ?? '');
    $timestamp = (string)($data['timestamp'] ?? '');
    $signature = (string)($data['signature'] ?? '');
    return hash_equals($signature, hash_hmac('sha256', $timestamp . $token, MAILGUN_SIGNING_KEY));
}

// Only handle POSTs from Mailgun.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => true, 'message' => 'Mailgun webhook endpoint ready (send a POST to trigger)']);
}

$data = array_merge($_POST, json_body());

if (!verify_mailgun_signature($data)) {
    http_response_code(403);
    respond(['error' => 'Invalid Mailgun signature']);
}

$message = [
    'message_id' => (string)($data['Message-Id'] ?? $data['message-id'] ?? ''),
    'from'       => (string)($data['From'] ?? $data['from'] ?? ''),
    'to'         => (string)($data['To'] ?? $data['to'] ?? ''),
    'cc'         => (string)($data['Cc'] ?? ''),
    'subject'    => (string)($data['Subject'] ?? $data['subject'] ?? ''),
    'body_html'  => (string)($data['body-html'] ?? ''),
    'body_plain' => (string)($data['body-plain'] ?? ''),
    'received_at'=> gmdate('Y-m-d H:i:s', (int)($data['Timestamp'] ?? time())),
];

// ============================================================================
// TODO (when real Mailgun is connected):
//   1. Match the recipient/from address against a contact in evee_crm
//      (e.g. SELECT * FROM contacts WHERE email = :from).
//   2. Save the message into a new `email_messages` table + link it to the
//      contact so it shows under the lead's conversation / Activity feed.
//   3. Reply via the frontend Mailgun placeholder (src/services/mailgun.ts).
// ============================================================================
// Example storage stub:
// $stmt = db()->prepare(
//     'INSERT INTO email_messages (contact_id, message_id, direction, from_address, to_address, subject, body_html, received_at)
//      VALUES (:contact_id, :message_id, "inbound", :from_address, :to_address, :subject, :body_html, :received_at)'
// );
// $stmt->execute([...]);

respond(['ok' => true, 'message' => 'Inbound email received (placeholder)', 'data' => $message], 200);
