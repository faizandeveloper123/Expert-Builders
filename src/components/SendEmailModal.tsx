import { useRef, useState } from 'react';
import {
  FaChevronDown,
  FaCircleInfo,
  FaEnvelopeOpenText,
  FaPaperclip,
  FaRegPaperPlane,
  FaTag,
  FaWandMagicSparkles,
  FaXmark,
} from 'react-icons/fa6';
import type { Contact } from '../types';
import { logBulkAction } from '../data/bulkActionsStore';
import { sendSmtpEmail, sendSmtpTestEmail } from '../services/smtp';
import Avatar from './Avatar';
import RichTextEditor from './RichTextEditor';

interface SendEmailModalProps {
  selectedContacts: Contact[];
  senderName: string;
  senderEmail: string;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

type Stage = 'confirm' | 'info' | 'composer';

const inputCls =
  'w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition';
const labelCls = 'block text-[11px] font-semibold text-slate-700 mb-1.5';
const outlineBtnCls =
  'px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap';
const primaryBtnCls =
  'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

function SendEmailModal({ selectedContacts, senderName, senderEmail, onClose, onNotify }: SendEmailModalProps) {
  const [stage, setStage] = useState<Stage>('confirm');
  const [actionName, setActionName] = useState('');
  const [fromName, setFromName] = useState(senderName);
  const [fromEmail, setFromEmail] = useState(senderEmail);
  const [subject, setSubject] = useState('');
  const [preHeader, setPreHeader] = useState('');
  const [emailType, setEmailType] = useState<'quick' | 'builder' | 'template'>('quick');
  const [message, setMessage] = useState('');
  const [sendMode, setSendMode] = useState<'all' | 'scheduled' | 'batch'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRecipients = selectedContacts.filter((c) => c.email && c.email.trim());
  const validCount = validRecipients.length;
  const filteredOut = selectedContacts.length - validCount;

  const proceed = () => {
    if (validCount === 0 || selectedContacts.length <= 1) setStage('info');
    else setStage('composer');
  };

  const textContent = message.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const charCount = textContent.length;
  const wordCount = charCount ? textContent.split(' ').length : 0;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
    e.target.value = '';
  };

  const sendTestMail = async () => {
    const to = testEmail.trim();
    if (!to) {
      onNotify('Enter a test email ID first');
      return;
    }
    setSending(true);
    try {
      await sendSmtpTestEmail(to);
      onNotify(`Test email sent from crm@yadea.com.pk to ${to}`);
      setTestEmail('');
    } catch (err) {
      onNotify(`Test email failed: ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  const reviewCampaign = () => onNotify('Reviewing campaign summary');

  const sendEmail = async () => {
    if (!actionName.trim()) return onNotify('Action name is required');
    if (!subject.trim()) return onNotify('Subject is required');
    if (charCount === 0) return onNotify('Email message is required');
    if (!consent) return onNotify('Please confirm recipient consent before sending');

    setSending(true);
    try {
      const result = await sendSmtpEmail({
        to: validRecipients.map((c) => c.email!.trim()),
        subject: subject.trim(),
        html: message,
        fromName: fromName.trim() || undefined,
      });
      logBulkAction({
        label: `Email "${actionName.trim()}" — ${result.sent_count} sent${
          result.failed_count > 0 ? `, ${result.failed_count} failed` : ''
        }`,
        operation: 'Email',
      });
      if (result.sent_count > 0) {
        onNotify(
          `Campaign "${actionName.trim()}" sent via SMTP (${result.sent_count} delivered` +
            (result.failed_count > 0 ? `, ${result.failed_count} failed)` : ')')
        );
      } else {
        const firstErr = Object.values(result.failed)[0] ?? 'unknown error';
        onNotify(`Send failed: ${firstErr}`);
      }
      onClose();
    } catch (err) {
      onNotify(`Send failed: ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  const emailTypeOptions: { id: typeof emailType; label: string; icon: React.ReactNode }[] = [
    { id: 'quick', label: 'Quick compose', icon: <FaRegPaperPlane className="text-[13px]" /> },
    { id: 'builder', label: 'From Smart Builder', icon: <FaWandMagicSparkles className="text-[13px]" /> },
    { id: 'template', label: 'Select existing template', icon: <FaEnvelopeOpenText className="text-[13px]" /> },
  ];

  const sendModeOptions: { id: typeof sendMode; label: string }[] = [
    { id: 'all', label: 'Send all at once' },
    { id: 'scheduled', label: 'Send all at scheduled time' },
    { id: 'batch', label: 'Send in batch mode' },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 evee-fade-in">
      {stage === 'confirm' && (
        <div className="animate-pop w-[560px] max-w-full max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Confirm recipient list</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review final recipient selection to be included in the bulk action
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
              <FaXmark className="text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">Final recipient list ({validCount})</h4>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Total Contacts selected: {selectedContacts.length}
                </span>
                <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Filtered out (invalid/unsubscribed): {filteredOut}
                </span>
              </div>
            </div>

            {validCount > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                  Recipients
                </div>
                <div className="divide-y divide-slate-100">
                  {validRecipients.map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5 px-3 py-2">
                      <Avatar initials={c.initials} color={c.avatarColor} image={c.image} size="w-7 h-7" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-700 truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{c.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <FaCircleInfo className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Please note the actions will be performed over a period of time. You can track the progress on the
                &apos;Bulk actions&apos; page or &apos;Bulk Action Campaigns &gt; Email Marketing&apos;.
              </p>
            </div>
          </div>

          <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-3 flex-shrink-0">
            <button onClick={onClose} className={outlineBtnCls}>
              Cancel
            </button>
            <button onClick={proceed} className={primaryBtnCls}>
              Confirm and proceed
            </button>
          </div>
        </div>
      )}

      {stage === 'info' && (
        <div className="animate-pop w-[420px] max-w-full bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-slate-800 text-base">Info</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
              <FaXmark className="text-lg" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center gap-3 px-6 py-8">
            <FaCircleInfo className="text-blue-500 text-2xl" />
            <p className="text-sm text-slate-600 leading-relaxed">
              Select one or more &apos;Contacts&apos; to start this operation
            </p>
          </div>

          <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
            <button onClick={onClose} className={primaryBtnCls}>
              Close
            </button>
          </div>
        </div>
      )}

      {stage === 'composer' && (
        <div className="animate-pop w-[860px] max-w-full max-h-[92vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Bulk email</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sends email with preferred template to selected contacts
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
              <FaXmark className="text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label className={labelCls}>Send email to following contacts</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedContacts.map((c) => (
                  <span key={c.id} title={c.name} className="inline-block">
                    <Avatar initials={c.initials} color={c.avatarColor} image={c.image} size="w-8 h-8" />
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Action name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                placeholder="e.g., Spring Sale Campaign"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  From name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="e.g., John from Acme Corp"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  From email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none" />
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Save 20% on Your Next Purchase"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Pre-header (preview text) (Optional)</label>
              <input
                type="text"
                value={preHeader}
                onChange={(e) => setPreHeader(e.target.value)}
                placeholder="Preview text shown next to the subject line"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Email type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {emailTypeOptions.map((opt) => (
                  <label key={opt.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="email-type"
                      value={opt.id}
                      checked={emailType === opt.id}
                      onChange={() => setEmailType(opt.id)}
                      className="peer hidden"
                    />
                    <div
                      className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-xs font-medium transition ${
                        emailType === opt.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex-shrink-0">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Type your message <span className="text-red-500">*</span>
              </label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <RichTextEditor
                  value={message}
                  onChange={setMessage}
                  placeholder="Type your message..."
                  minHeight={180}
                />
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      hidden
                      onChange={handleFiles}
                      aria-label="Attach files to email"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      <FaPaperclip className="text-slate-400 text-[11px]" />
                      + Add attachments
                    </button>
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {attachments.map((name, i) => (
                          <span
                            key={`${name}-${i}`}
                            className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 text-[10px] font-medium text-blue-700"
                          >
                            <FaPaperclip className="text-[8px] flex-shrink-0" />
                            <span className="max-w-[120px] truncate">{name}</span>
                            <button
                              type="button"
                              onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-blue-500 hover:text-red-500 text-[10px] flex-shrink-0"
                              title="Remove attachment"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {wordCount} words &middot; {charCount} characters
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Sending mode</label>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {sendModeOptions.map((mode) => (
                  <label key={mode.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="radio"
                      name="send-mode"
                      value={mode.id}
                      checked={sendMode === mode.id}
                      onChange={() => setSendMode(mode.id)}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
              >
                <span className="text-xs font-semibold text-slate-700">Additional settings</span>
                <FaChevronDown
                  className={`text-[10px] text-slate-400 transition-transform duration-200 ${
                    settingsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {settingsOpen && (
                <div className="px-4 py-3 space-y-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Enable email tracking (opens & clicks)</span>
                    <button
                      type="button"
                      onClick={() => onNotify('Tracking toggled')}
                      className="w-8 h-4 rounded-full bg-blue-600 relative transition"
                      aria-label="Tracking enabled"
                    >
                      <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-white rounded-full" />
                    </button>
                  </div>
                  <div>
                    <label className={labelCls}>Reply-to email</label>
                    <input type="email" placeholder="replies@company.com" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Unsubscribe link</label>
                    <input type="text" placeholder="https://yourdomain.com/unsubscribe" className={inputCls} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={labelCls}>Test email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendTestMail();
                    }
                  }}
                  placeholder="Type test email ID"
                  className={inputCls}
                />
              </div>
              <button type="button" onClick={() => void sendTestMail()} disabled={sending} className={outlineBtnCls}>
                {sending ? 'Sending…' : 'Send test mail'}
              </button>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-600 leading-relaxed">
                I confirm all contacts in this import have consented to hear from us. I&apos;ve previously contacted
                them within the last past year, and this list is not from a third party.
              </span>
            </label>
          </div>

          <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
            <button onClick={onClose} className={outlineBtnCls}>
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button onClick={reviewCampaign} className={outlineBtnCls}>
                Review campaign
              </button>
              <button onClick={() => void sendEmail()} disabled={sending} className={primaryBtnCls}>
                {sending ? 'Sending…' : 'Send email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SendEmailModal;
