import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type ApiContact } from '../api';
import { logActivity } from '../data/activityLog';
import { initialsFromName } from '../utils';
import { useStaff } from '../StaffContext';
import { useAuth } from '../auth';
import { sendSmtpEmail } from '../services/smtp';
import ContactInfoPanel from './ContactInfoPanel';
import RightSidebar from './RightSidebar';
import RichTextEditor from './RichTextEditor';
import {
  FaBell,
  FaBellSlash,
  FaChevronDown,
  FaComment,
  FaEnvelope,
  FaEye,
  FaPaperclip,
  FaPaperPlane,
  FaPhone,
  FaPlus,
  FaRegCalendar,
  FaRegStar,
  FaVideo,
  FaWandMagicSparkles,
  FaWhatsapp,
} from 'react-icons/fa6';

interface LeadDetailPageProps {
  contactId: number;
  onBack: () => void;
  onNotify: (msg: string) => void;
  onAvatarUpdated?: (id: number, data: string) => void;
  position: { current: number; total: number };
  onNavigate: (dir: 'prev' | 'next') => void;
}

function LeadDetailPage({ contactId, onBack, onNotify, onAvatarUpdated, position, onNavigate }: LeadDetailPageProps) {
  const staff = useStaff();
  const { user: currentUser } = useAuth();
  const mentionUsers = useMemo(
    () => staff.staff.map((s) => s.full_name),
    [staff.staff]
  );
  const [contact, setContact] = useState<ApiContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [rightPanel, setRightPanel] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'details' | 'chat' | 'tools'>('chat');
  const [composerType, setComposerType] = useState<'whatsapp' | 'sms' | 'email'>('sms');
  const [composerMenuOpen, setComposerMenuOpen] = useState(false);
  const [internalMode, setInternalMode] = useState(false);
  const [emailFrom, setEmailFrom] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailBcc, setEmailBcc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ id: number; text: string; time: string }[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const commentIdRef = useRef(1);

  useEffect(() => {
    if (contact && emailTo === '') setEmailTo(contact.email || '');
  }, [contact, emailTo]);

  const assignedStaff = useMemo(
    () => staff.staff.find((s) => s.id === (contact?.assigned_to ?? null)) ?? null,
    [staff.staff, contact]
  );

  // Default the email "From" fields to the staff member the lead is assigned to.
  useEffect(() => {
    if (assignedStaff) {
      setEmailFrom((prev) => prev || assignedStaff.email || '');
      setEmailFromName((prev) => prev || assignedStaff.full_name || '');
    }
  }, [assignedStaff]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getContact(contactId)
      .then((res) => {
        if (!cancelled) setContact(res.data);
      })
      .catch((err) => {
        if (!cancelled) onNotify(`Failed to load lead: ${(err as Error).message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contactId, onNotify]);

  useEffect(() => {
    setContact(null);
    setLoading(true);
    setRightPanel(null);
    setMobileView('chat');
    setComposerType('sms');
    setComposerMenuOpen(false);
    setInternalMode(false);
    setEmailFrom('');
    setEmailFromName('');
    setEmailTo('');
    setEmailCc('');
    setEmailBcc('');
    setEmailSubject('');
    setEmailBody('');
    setShowCcBcc(false);
    setAttachments([]);
    setCommentText('');
    setComments([]);
    setMentionQuery(null);
  }, [contactId]);

  if (loading && !contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f6f9] text-xs text-slate-500">
        Loading lead details...
      </div>
    );
  }

  if (!contact) return null;

  const initials = initialsFromName(contact.name);
  const togglePanel = (panel: string) => setRightPanel((prev) => (prev === panel ? null : panel));

  const composerLabel = {
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    email: 'Email',
  } as const;

  const composerIcon = {
    whatsapp: <FaWhatsapp className="text-xs" />,
    sms: <FaComment className="text-xs" />,
    email: <FaEnvelope className="text-xs" />,
  };

  const selectComposerType = (type: 'whatsapp' | 'sms' | 'email') => {
    setComposerType(type);
    setInternalMode(false);
    setComposerMenuOpen(false);
    if (type === 'email' && emailTo === '') setEmailTo(contact.email || '');
  };

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
      onNotify(`${files.length} file(s) attached`);
    }
    e.target.value = '';
  };

  const sendEmail = async () => {
    const to = emailTo.trim();
    if (!to || !to.includes('@')) return onNotify('Recipient email is required');
    if (!emailSubject.trim()) return onNotify('Subject is required');
    const plain = emailBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return onNotify('Message body is required');

    setSendingEmail(true);
    try {
      // Sent from the CRM mailbox (crm@yadea.com.pk) via the backend SMTP
      // endpoint — see src/services/smtp.ts and api/mail_config.php.
      const result = await sendSmtpEmail({
        to: to.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean),
        cc: emailCc.trim() ? [emailCc.trim()] : undefined,
        bcc: emailBcc.trim() ? [emailBcc.trim()] : undefined,
        subject: emailSubject.trim(),
        html: emailBody,
        fromName: emailFromName.trim() || undefined,
      });
      if (result.sent_count > 0) {
        onNotify(`Email sent to ${emailTo.trim()} via crm@yadea.com.pk`);
        logActivity({ type: 'email', title: 'Email sent', detail: emailTo.trim(), contactId: contact.id });
        setEmailCc('');
        setEmailBcc('');
        setEmailSubject('');
        setEmailBody('');
        setAttachments([]);
        setShowCcBcc(false);
      } else {
        onNotify(`Send failed: ${Object.values(result.failed)[0] ?? 'unknown error'}`);
      }

      // Notify the contact's owner + followers so the team knows a message
      // was sent about this lead.
      if (result.sent_count > 0) {
        const targets = new Set<number>();
        if (contact.assigned_to) targets.add(contact.assigned_to);
        (contact.followers ?? []).forEach((f) => targets.add(f.id));
        if (targets.size > 0) {
          try {
            await api.createNotification({
              staff_ids: [...targets],
              contact_id: contact.id,
              type: 'message',
              title: `Message sent to ${contact.name}`,
              detail: `An email was sent to ${emailTo.trim()} for ${contact.name}.`,
            });
          } catch {
            /* notification is best-effort */
          }
        }
      }
    } catch (err) {
      onNotify(`Email failed: ${(err as Error).message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCommentText(value);
    const lastWord = value.split(/\s+/).pop() ?? '';
    setMentionQuery(lastWord.startsWith('@') ? lastWord.slice(1) : null);
  };

  const selectMention = (user: string) => {
    const words = commentText.split(/\s+/);
    words[words.length - 1] = `@${user}`;
    setCommentText(words.join(' ') + ' ');
    setMentionQuery(null);
    commentRef.current?.focus();
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const text = commentText.trim();
    setComments((prev) => [...prev, { id: commentIdRef.current++, text, time }]);
    setCommentText('');
    setMentionQuery(null);
    onNotify('Internal comment added');
    logActivity({ type: 'comment', title: 'Internal comment added', detail: text, contactId: contact.id });

    // @mention handling: everyone named in the comment gets a notification.
    const lower = text.toLowerCase();
    const mentioned = staff.staff.filter((s) => s.full_name && lower.includes(`@${s.full_name.toLowerCase()}`));
    if (mentioned.length > 0 && currentUser) {
      try {
        const names = mentioned.map((m) => m.first_name).join(', @');
        await api.createNotification({
          staff_ids: mentioned.map((m) => m.id),
          contact_id: contact.id,
          type: 'mention',
          title: `${currentUser.full_name} mentioned you`,
          detail: `@${names} mentioned you in a comment on ${contact.name}: "${text}"`,
        });
      } catch {
        /* notification is best-effort */
      }
    }
  };

  const mentionSuggestions = mentionUsers.filter((u) =>
    u.toLowerCase().includes((mentionQuery ?? '').toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#f4f6f9] p-2 gap-2 overflow-hidden">
      {/* Mobile panel switcher (hidden on desktop) */}
      <div className="lg:hidden flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs font-medium text-slate-600 flex-shrink-0 shadow-sm overflow-x-auto no-scrollbar">
        {(
          [
            ['details', 'Details'],
            ['chat', 'Conversation'],
            ['tools', 'Tools'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMobileView(id)}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
              mobileView === id ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={`min-w-0 ${
          mobileView === 'details'
            ? 'flex flex-1 min-h-0 overflow-hidden w-full lg:w-auto lg:flex-none'
            : 'hidden lg:flex lg:w-auto lg:flex-none'
        }`}
      >
        <ContactInfoPanel
          contact={contact}
          onBack={onBack}
          onNotify={onNotify}
          onOpenDrawer={(p) => setRightPanel(p)}
          onAvatarUpdated={(data) => {
            setContact((prev) => (prev ? { ...prev, avatar_data: data } : prev));
            onAvatarUpdated?.(contactId, data);
          }}
          onSaved={(updates) => setContact((prev) => (prev ? { ...prev, ...updates } : prev))}
          position={position}
          onNavigate={onNavigate}
        />
      </div>

      <section
        className={`${
          mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
        } flex-1 bg-white rounded-lg border border-slate-200 flex-col overflow-hidden shadow-sm min-w-0`}
      >
        <div className="m-3 p-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <FaWandMagicSparkles className="text-xs" />
            </div>
            <div className="truncate">
              <h4 className="font-bold text-slate-800 text-xs truncate">Do more faster with Ask AI</h4>
              <p className="text-[11px] text-slate-500 truncate">
                Enable Ask AI to automate tasks, generate content, and execute commands.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2 sm:ml-2 mt-2 sm:mt-0">
            <button
              onClick={() => onNotify('Ask AI coming soon')}
              className="bg-blue-600 text-white font-semibold text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 transition flex items-center space-x-1 shadow-sm"
            >
              <span>Enable Ask AI</span>
              <FaPlus className="text-[10px]" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 font-bold flex items-center justify-center text-xs overflow-hidden">
              {contact.avatar_data ? (
                <img src={contact.avatar_data} alt={contact.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="font-semibold text-slate-800 text-xs">{contact.name}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-xs">
            <button onClick={() => onNotify('Message coming soon')} className="hover:text-slate-800">
              <FaComment />
            </button>
            <button onClick={() => onNotify(`Calling ${contact.name}...`)} className="hover:text-slate-800">
              <FaPhone />
            </button>
            <button onClick={() => onNotify('Video call coming soon')} className="hover:text-slate-800">
              <FaVideo />
            </button>
            <button onClick={() => onNotify('Mark as important')} className="hover:text-slate-800">
              <FaRegStar />
            </button>
            <button onClick={() => onNotify(`Emailing ${contact.name}...`)} className="hover:text-slate-800">
              <FaEnvelope />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 min-h-0">
          <div className="flex justify-center">
            <span className="bg-white px-3 py-0.5 border border-slate-200 rounded-full text-[10px] text-slate-500 font-medium shadow-sm">
              <FaRegCalendar className="inline mr-1 text-[9px]" /> Today
            </span>
          </div>

          <div className="flex justify-center">
            <div className="bg-white border border-slate-200/80 rounded-full px-4 py-1.5 shadow-sm flex items-center space-x-2 text-xs text-slate-600 max-w-full truncate">
              <FaBellSlash className="text-slate-500 flex-shrink-0" />
              <span className="font-medium text-[11px] truncate">
                <strong className="font-semibold text-slate-700">DND enabled by user</strong> for SMS, Email and Call
              </span>
              <span className="text-[10px] text-slate-400 flex-shrink-0">03:03 PM</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white border border-slate-200/80 rounded-full px-4 py-1.5 shadow-sm flex items-center space-x-2 text-xs text-slate-600 max-w-full truncate">
              <FaBell className="text-slate-500 flex-shrink-0" />
              <span className="font-medium text-[11px] truncate">
                <strong className="font-semibold text-slate-700">DND disabled by user</strong> for Email
              </span>
              <span className="text-[10px] text-slate-400 flex-shrink-0">03:01 PM</span>
            </div>
          </div>

          {comments.map((c) => (
            <div key={c.id} className="flex justify-end">
              <div className="bg-white border border-amber-200 rounded-lg rounded-tr-none px-3 py-2 shadow-sm max-w-[75%]">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-semibold mb-1">
                  <FaEye className="text-[9px]" /> Internal Comment
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap break-words">{c.text}</p>
                <div className="text-[10px] text-slate-400 mt-1">{c.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
              <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-slate-200 bg-slate-100/60 text-xs gap-1.5">
                <div className="relative">
                  <button
                    onClick={() => setComposerMenuOpen((v) => !v)}
                    className="font-semibold text-blue-600 flex items-center gap-1.5 py-0.5"
                  >
                    {composerIcon[composerType]}
                    <span>{composerLabel[composerType]}</span>
                    <FaChevronDown className="text-[9px]" />
                  </button>

                  {composerMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setComposerMenuOpen(false)} />
                      <div className="absolute left-0 top-7 z-30 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-44 text-xs">
                        {(
                          [
                            { id: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp className="text-xs" /> },
                            { id: 'sms', label: 'SMS', icon: <FaComment className="text-xs" /> },
                            { id: 'email', label: 'Email', icon: <FaEnvelope className="text-xs" /> },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => selectComposerType(opt.id)}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 transition ${
                              composerType === opt.id ? 'text-blue-600 font-semibold' : 'text-slate-700'
                            }`}
                          >
                            {opt.icon}
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Internal Comment is a standalone option (separate from the
                    channel dropdown) so it is always one click away. */}
                <button
                  onClick={() => {
                    setInternalMode((v) => !v);
                    setComposerMenuOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition ${
                    internalMode
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <FaEye className="text-[10px]" />
                  <span>Internal Comment</span>
                  {internalMode ? (
                    <span className="bg-white/25 text-[9px] px-1.5 rounded-full">ON</span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 rounded-full">OFF</span>
                  )}
                </button>
              </div>

              {internalMode ? (
                <div className="p-3 bg-white relative">
                  <textarea
                    ref={commentRef}
                    value={commentText}
                    onChange={handleCommentChange}
                    placeholder="Write an internal comment... type @ to mention someone"
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                  />
                  {mentionQuery !== null && mentionSuggestions.length > 0 && (
                    <div className="absolute left-3 right-3 bottom-[52px] z-30 bg-white border border-slate-200 rounded-md shadow-lg py-1 text-xs max-h-36 overflow-y-auto">
                      {mentionSuggestions.map((u) => {
                        const matched = staff.staff.find((s) => s.full_name === u);
                        return (
                          <button
                            key={u}
                            onClick={() => selectMention(u)}
                            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center gap-2 text-slate-700"
                          >
                            {matched?.avatar_data ? (
                              <img src={matched.avatar_data} alt={u} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                {u
                                  .split(' ')
                                  .map((p) => p[0])
                                  .slice(0, 2)
                                  .join('')}
                              </span>
                            )}
                            {u}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <FaEye className="text-[9px]" /> Visible only to your team
                    </span>
                    <button
                      onClick={postComment}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded-md transition shadow-sm"
                    >
                      <FaPaperPlane className="text-xs" /> Post Comment
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {composerType === 'sms' && (
                <div className="p-4 bg-white">
                  <h5 className="font-bold text-slate-800 text-xs">No Phone Number Added</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    You need a phone number to send SMS. Purchase one now to start messaging
                  </p>
                  <button
                    onClick={() => onNotify('Purchasing phone number...')}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-md transition shadow-sm"
                  >
                    Purchase Now
                  </button>
                </div>
              )}

              {composerType === 'whatsapp' && (
                <div className="p-4 bg-white">
                  <h5 className="font-bold text-slate-800 text-xs">WhatsApp Not Connected</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Connect WhatsApp to start messaging this contact directly
                  </p>
                  <button
                    onClick={() => onNotify('Connecting WhatsApp...')}
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-md transition shadow-sm flex items-center gap-1.5"
                  >
                    <FaWhatsapp className="text-xs" />
                    Connect WhatsApp
                  </button>
                </div>
              )}

              {composerType === 'email' && (
                <div className="bg-white flex flex-col">
                  {/* Scrollable field area — never pushes the Send bar off-screen */}
                  <div className="max-h-[44vh] overflow-y-auto p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={emailFromName}
                        onChange={(e) => setEmailFromName(e.target.value)}
                        placeholder="From name"
                        className="w-full bg-transparent border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={emailFrom}
                        onChange={(e) => setEmailFrom(e.target.value)}
                        placeholder="From email"
                        className="w-full bg-transparent border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-medium w-8 flex-shrink-0">To:</span>
                      <input
                        type="text"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="recipient@email.com"
                        className="flex-1 min-w-0 bg-transparent border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCcBcc((v) => !v)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded border transition flex-shrink-0 ${
                          showCcBcc
                            ? 'bg-blue-50 border-blue-300 text-blue-600'
                            : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        Cc/Bcc
                      </button>
                    </div>
                    {showCcBcc && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400 font-medium w-8 flex-shrink-0">CC:</span>
                          <input
                            type="text"
                            value={emailCc}
                            onChange={(e) => setEmailCc(e.target.value)}
                            placeholder="cc@email.com"
                            className="flex-1 min-w-0 bg-transparent border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400 font-medium w-8 flex-shrink-0">BCC:</span>
                          <input
                            type="text"
                            value={emailBcc}
                            onChange={(e) => setEmailBcc(e.target.value)}
                            placeholder="bcc@email.com"
                            className="flex-1 min-w-0 bg-transparent border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-1.5 text-xs border-t border-slate-100 pt-2">
                      <span className="text-slate-400 font-medium w-14 flex-shrink-0">Subject:</span>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Enter subject"
                        className="flex-1 min-w-0 bg-transparent border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="border-t border-slate-100 pt-2">
                      <RichTextEditor
                        value={emailBody}
                        onChange={setEmailBody}
                        placeholder="Write your message..."
                        minHeight={120}
                      />
                    </div>
                  </div>

                  {/* Sticky action bar — always visible */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-200 bg-slate-50/60">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={handleAttach}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 border border-slate-200 bg-white rounded px-2.5 py-1.5 hover:border-blue-300 transition flex-shrink-0"
                      >
                        <FaPaperclip className="text-xs" />
                        Attach
                      </button>
                      {attachments.map((name, i) => (
                        <span
                          key={`${name}-${i}`}
                          className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 text-[10px] text-slate-600 max-w-[140px]"
                        >
                          <FaPaperclip className="text-[9px] flex-shrink-0" />
                          <span className="truncate">{name}</span>
                          <button
                            onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-slate-400 hover:text-red-500 flex-shrink-0"
                            title="Remove attachment"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => void sendEmail()}
                      disabled={sendingEmail}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-1.5 rounded-md transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <FaPaperPlane className="text-xs" />
                      {sendingEmail ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </div>
              )}

                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div
        className={`min-w-0 ${
          mobileView === 'tools'
            ? 'flex flex-1 min-h-0 overflow-hidden w-full lg:w-auto lg:flex-none'
            : 'hidden lg:flex lg:w-auto lg:flex-none'
        }`}
      >
        <RightSidebar
          contactId={contactId}
          contactName={contact.name}
          contactEmail={contact.email || ''}
          contactPhone={contact.phone || ''}
          panel={rightPanel}
          onTogglePanel={togglePanel}
          onClosePanel={() => setRightPanel(null)}
          onNotify={onNotify}
        />
      </div>
    </div>
  );
}

export default LeadDetailPage;
