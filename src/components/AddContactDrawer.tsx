import React, { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  FaArrowDownLong,
  FaArrowUpRightFromSquare,
  FaComment,
  FaEnvelope,
  FaMobileScreen,
  FaRegCircleQuestion,
  FaRegTrashCan,
  FaRegUser,
  FaXmark,
} from 'react-icons/fa6';
import { countryCodes, timezones } from '../data/formOptions';
import {
  CONTACT_TYPE_OPTIONS,
  contactPropertyFields,
  emptyContactProperties,
  readContactProperties,
} from '../data/contactPropertyFields';
import { fileToResizedDataUrl } from '../utils';
import type { Contact } from '../types';

export interface NewContactData {
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  tag: string;
  image?: string;
  initials: string;
  avatarColor: string;
  customFields: Record<string, string>;
}

interface EmailRow {
  id: number;
  value: string;
  isPrimary: boolean;
}

interface PhoneRow {
  id: number;
  type: string;
  dialCode: string;
  value: string;
  isPrimary: boolean;
}

interface AddContactDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewContactData) => void;
  onNotify: (msg: string) => void;
  /** When set, the drawer pre-fills with this contact and behaves as "Edit". */
  editingContact?: Contact | null;
}

const initialEmails: EmailRow[] = [{ id: 1, value: '', isPrimary: true }];
const initialPhones: PhoneRow[] = [
  { id: 1, type: 'Mobile', dialCode: '+92', value: '', isPrimary: true },
];

function AddContactDrawer({ open, onClose, onSave, onNotify, editingContact }: AddContactDrawerProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showError, setShowError] = useState(false);
  const [emails, setEmails] = useState<EmailRow[]>(initialEmails);
  const [phones, setPhones] = useState<PhoneRow[]>(initialPhones);
  const [contactType, setContactType] = useState<string>('Lead');
  const [properties, setProperties] = useState<Record<string, string>>(() => emptyContactProperties());
  const [timeZone, setTimeZone] = useState('Asia/Karachi');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dndAll, setDndAll] = useState(false);
  const [channels, setChannels] = useState({
    email: false,
    text: false,
    calls: false,
    inbound: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(2);

  // Split a stored phone ("+92 3001234" or "0300 1234") into dial + number.
  const splitPhone = (raw?: string): { dial: string; num: string } => {
    const value = raw ?? '';
    const match = value.trim().match(/^(\+\d{1,4})[\s-]+(.*)$/);
    if (match) return { dial: match[1], num: match[2] };
    if (value.startsWith('+')) return { dial: '', num: value.trim() };
    return { dial: '+92', num: value.trim() };
  };

  const prefill = (contact: Contact) => {
    const parts = contact.name.split(' ').filter(Boolean);
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
    setShowError(false);
    setEmails(
      contact.email
        ? [{ id: 1, value: contact.email, isPrimary: true }]
        : [{ id: 1, value: '', isPrimary: true }]
    );
    const parsed = splitPhone(contact.phone);
    setPhones([
      {
        id: 1,
        type: 'Mobile',
        dialCode: parsed.dial || '+92',
        value: parsed.num,
        isPrimary: true,
      },
    ]);
    setContactType(contact.contactType || (contact.tags?.[0] ?? '') || 'Lead');
    setProperties(readContactProperties(contact.customFields));
    setTimeZone('Asia/Karachi');
    setProfileImage(contact.image ?? null);
    setDndAll(false);
    setChannels({ email: false, text: false, calls: false, inbound: false });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (open) {
      if (editingContact) prefill(editingContact);
      else resetForm();
    }
  }, [open, editingContact]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setShowError(false);
    setEmails([{ id: 1, value: '', isPrimary: true }]);
    setPhones([{ id: 1, type: 'Mobile', dialCode: '+92', value: '', isPrimary: true }]);
    setContactType('Lead');
    setProperties(emptyContactProperties());
    setTimeZone('Asia/Karachi');
    setProfileImage(null);
    setDndAll(false);
    setChannels({ email: false, text: false, calls: false, inbound: false });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDpUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setProfileImage(await fileToResizedDataUrl(file));
    } catch {
      setProfileImage(null);
    }
    event.target.value = '';
  };

  const addEmailRow = () => {
    setEmails((prev) => [...prev, { id: idCounter.current++, value: '', isPrimary: false }]);
  };

  const removeEmailRow = (id: number) => {
    setEmails((prev) => {
      if (prev.length > 1) return prev.filter((row) => row.id !== id);
      return prev.map((row) => (row.id === id ? { ...row, value: '' } : row));
    });
  };

  const addPhoneRow = () => {
    setPhones((prev) => [
      ...prev,
      {
        id: idCounter.current++,
        type: 'Mobile',
        dialCode: '+92',
        value: '',
        isPrimary: false,
      },
    ]);
  };

  const removePhoneRow = (id: number) => {
    setPhones((prev) => {
      if (prev.length > 1) return prev.filter((row) => row.id !== id);
      return prev.map((row) => (row.id === id ? { ...row, value: '' } : row));
    });
  };

  const handleSave = (addAnother: boolean) => {
    if (!firstName.trim()) {
      setShowError(true);
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const primaryEmail = emails.find((e) => e.isPrimary && e.value.trim())?.value.trim();
    const primaryPhone = phones.find((p) => p.isPrimary && p.value.trim());
    const phone = primaryPhone ? `${primaryPhone.dialCode} ${primaryPhone.value.trim()}` : undefined;
    const tag = CONTACT_TYPE_OPTIONS.includes(contactType as (typeof CONTACT_TYPE_OPTIONS)[number])
      ? contactType
      : 'Lead';

    const initials =
      fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'NC';

    // When editing, keep the existing color; otherwise assign a random one.
    const avatarColors = [
      'bg-emerald-200 text-emerald-800',
      'bg-sky-200 text-sky-800',
      'bg-purple-200 text-purple-800',
      'bg-amber-200 text-amber-800',
      'bg-rose-200 text-rose-800',
    ];
    const avatarColor = editingContact
      ? editingContact.avatarColor
      : avatarColors[Math.floor(Math.random() * avatarColors.length)];

    onSave({
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      email: primaryEmail,
      tag,
      image: profileImage ?? undefined,
      initials,
      avatarColor,
      customFields: { ...properties },
    });

    onNotify(editingContact ? `Contact "${fullName}" updated` : `Contact "${fullName}" added successfully`);
    if (addAnother) {
      resetForm();
    } else {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <h3 className="text-base font-semibold text-slate-800">{editingContact ? 'Edit Contact' : 'Add Contact'}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1"
            aria-label="Close"
          >
            <FaXmark className="text-lg" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-1">
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-slate-700">Contact image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDpUpload}
                aria-label="Upload contact photo"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 group cursor-pointer hover:bg-slate-200/70 transition overflow-hidden"
                title="Click to upload profile photo"
              >
                {profileImage ? (
                  <img src={profileImage} className="w-full h-full object-cover" alt="Contact" />
                ) : (
                  <FaRegUser className="text-2xl text-slate-400" />
                )}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-white/90 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-600 shadow-sm z-10">
                  ✎
                </div>
              </div>
            </div>
            <a href="#" className="text-blue-600 hover:underline text-xs font-medium flex items-center gap-1 self-start">
              Customize form
              <FaArrowUpRightFromSquare className="text-[10px]" />
            </a>
          </div>

          {/* First name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Contact name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter contact name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (e.target.value.trim()) setShowError(false);
              }}
              className={
                showError
                  ? 'w-full border border-red-300 focus:border-red-500 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none placeholder-rose-300 bg-rose-50/20'
                  : 'w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none'
              }
            />
            {showError && <p className="text-red-500 text-[11px] mt-1">This field is required</p>}
          </div>

          {/* Last name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Last name</label>
            <input
              type="text"
              placeholder="Enter Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email</label>
            <div className="space-y-2">
              {emails.map((row) => (
                <div key={row.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={row.isPrimary}
                    name="primaryEmail"
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                    title="Set as primary email"
                    onChange={() =>
                      setEmails((prev) =>
                        prev.map((e) => ({ ...e, isPrimary: e.id === row.id }))
                      )
                    }
                  />
                  <input
                    type="email"
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Please enter email address"
                    value={row.value}
                    onChange={(e) =>
                      setEmails((prev) =>
                        prev.map((em) => (em.id === row.id ? { ...em, value: e.target.value } : em))
                      )
                    }
                  />
                  <button
                    onClick={() => removeEmailRow(row.id)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100"
                    aria-label="Remove email"
                  >
                    <FaRegTrashCan />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addEmailRow}
              className="mt-1.5 text-blue-600 hover:underline font-medium text-[11px] flex items-center gap-1"
            >
              + Add email
            </button>
          </div>

          {/* Phone */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone</label>
            <div className="space-y-2">
              {phones.map((row) => (
                <div key={row.id} className="flex items-center space-x-1.5">
                  <input
                    type="radio"
                    checked={row.isPrimary}
                    name="primaryPhone"
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                    title="Set as primary phone"
                    onChange={() =>
                      setPhones((prev) =>
                        prev.map((p) => ({ ...p, isPrimary: p.id === row.id }))
                      )
                    }
                  />
                  <select
                    className="w-20 border border-slate-300 rounded-md px-1.5 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    value={row.type}
                    onChange={(e) =>
                      setPhones((prev) =>
                        prev.map((p) => (p.id === row.id ? { ...p, type: e.target.value } : p))
                      )
                    }
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Landline">Landline</option>
                  </select>
                  <div className="flex-1 flex items-center border border-slate-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                    <select
                      className="px-1.5 py-2 bg-slate-50 border-r border-slate-200 text-slate-600 text-xs focus:outline-none cursor-pointer max-w-[95px]"
                      value={row.dialCode}
                      onChange={(e) =>
                        setPhones((prev) =>
                          prev.map((p) => (p.id === row.id ? { ...p, dialCode: e.target.value } : p))
                        )
                      }
                      aria-label="Country code"
                    >
                      {countryCodes.map((cc, idx) => (
                        <option key={idx} value={cc.code}>
                          {cc.flag} {cc.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="w-full px-2.5 py-2 text-xs focus:outline-none"
                      placeholder="Enter phone number"
                      value={row.value}
                      onChange={(e) =>
                        setPhones((prev) =>
                          prev.map((p) => (p.id === row.id ? { ...p, value: e.target.value } : p))
                        )
                      }
                    />
                  </div>
                  <button
                    onClick={() => removePhoneRow(row.id)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100"
                    aria-label="Remove phone"
                  >
                    <FaRegTrashCan />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addPhoneRow}
              className="mt-1.5 text-blue-600 hover:underline font-medium text-[11px] flex items-center gap-1"
            >
              + Add phone
            </button>
          </div>

          {/* Contact type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Contact type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_TYPE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setContactType(option)}
                  className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                    contactType === option
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                  aria-pressed={contactType === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Property & booking details */}
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-3 bg-white">
            <span className="block font-semibold text-slate-700">Property &amp; booking details</span>
            <div className="grid grid-cols-2 gap-3">
              {contactPropertyFields.map((field) => {
                const value = properties[field.key] ?? '';
                const controlClass =
                  'w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white text-slate-700';
                return (
                  <div key={field.key} className={field.type === 'textarea' ? 'col-span-2' : undefined}>
                    <label className="block font-semibold text-slate-700 mb-1">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={value}
                        onChange={(e) => setProperties((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={controlClass}
                      >
                        <option value="">Select status</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => setProperties((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={`${controlClass} resize-y`}
                      />
                    ) : (
                      <input
                        type={field.type === 'date' ? 'date' : 'text'}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => setProperties((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={controlClass}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time zone */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Time zone</label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white text-slate-600"
            >
              <option value="">Select Time zone</option>
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* DND Channels Card */}
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-3 bg-white">
            <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={dndAll}
                onChange={(e) => {
                  setDndAll(e.target.checked);
                  if (e.target.checked) {
                    setChannels({ email: false, text: false, calls: false, inbound: false });
                  }
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>DND all channels</span>
            </label>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                OR
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <div>
              <span className="block font-semibold text-slate-700 mb-2">Channels</span>
              <div className="space-y-2 pl-1">
                <ChannelCheckbox
                  label="Email"
                  icon={FaEnvelope}
                  checked={channels.email}
                  onChange={(v) => {
                    if (v) setDndAll(false);
                    setChannels((c) => ({ ...c, email: v }));
                  }}
                />
                <ChannelCheckbox
                  label="Text messages"
                  icon={FaComment}
                  checked={channels.text}
                  onChange={(v) => {
                    if (v) setDndAll(false);
                    setChannels((c) => ({ ...c, text: v }));
                  }}
                />
                <ChannelCheckbox
                  label="Calls & voicemail"
                  icon={FaMobileScreen}
                  checked={channels.calls}
                  onChange={(v) => {
                    if (v) setDndAll(false);
                    setChannels((c) => ({ ...c, calls: v }));
                  }}
                />
                <ChannelCheckbox
                  label="Inbound calls and SMS"
                  icon={FaArrowDownLong}
                  checked={channels.inbound}
                  onChange={(v) => {
                    if (v) setDndAll(false);
                    setChannels((c) => ({ ...c, inbound: v }));
                  }}
                  info
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
          {!editingContact && (
            <button
              onClick={() => handleSave(true)}
              className="text-slate-500 hover:text-slate-800 font-medium text-xs transition"
            >
              Save and add another
            </button>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition shadow-sm"
            >
              {editingContact ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChannelCheckboxProps {
  label: string;
  icon: IconType;
  checked: boolean;
  onChange: (value: boolean) => void;
  info?: boolean;
}

function ChannelCheckbox({ label, icon: Icon, checked, onChange, info }: ChannelCheckboxProps) {
  return (
    <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <Icon className="text-slate-500 text-xs w-4" />
      <span>{label}</span>
      {info && <FaRegCircleQuestion className="text-slate-400 text-[11px] ml-0.5" />}
    </label>
  );
}

export default AddContactDrawer;
