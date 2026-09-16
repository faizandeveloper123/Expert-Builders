import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  FaArrowUpRightFromSquare,
  FaCalendarDays,
  FaChevronDown,
  FaChevronUp,
  FaCirclePlus,
  FaClock,
  FaGlobe,
  FaLocationDot,
  FaMagnifyingGlass,
  FaPaperclip,
  FaPlus,
  FaRegEnvelope,
  FaRegPenToSquare,
  FaRegTrashCan,
  FaSliders,
  FaUser,
  FaXmark,
} from 'react-icons/fa6';
import type { Note, TaskItem } from '../api';
import { useStaff } from '../StaffContext';
import { countryCodes } from '../data/formOptions';
import { COUNTRIES } from '../data/countries';
import RichTextEditor from './RichTextEditor';

export interface Company {
  id: number;
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  state: string;
  city: string;
  description: string;
  postalCode: string;
  country: string;
}

interface PanelShellProps {
  title: string;
  sub?: string;
  right?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

function PanelShell({ title, sub, right, onClose, children }: PanelShellProps) {
  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className="px-4 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-[#1E293B] text-sm">{title}</h3>
          {sub && <span className="text-[#64748B] text-xs font-normal">{sub}</span>}
        </div>
        <div className="flex items-center space-x-2 text-xs">
          {right}
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] transition ml-1">
            <FaXmark className="text-sm" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-[#1E293B] mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-[0_0_0_2px_rgba(37,99,235,0.2)] transition';

/* ============================================================
   ASSOCIATIONS DRAWER PANEL (Image 1)
   ============================================================ */
interface AssociationsDrawerProps {
  companies: Company[];
  onClose: () => void;
  onOpenAddCompany: () => void;
  onNotify: (msg: string) => void;
  onRemoveCompany: (id: number) => void;
}

export function AssociationsDrawer({
  companies,
  onClose,
  onOpenAddCompany,
  onNotify,
  onRemoveCompany,
}: AssociationsDrawerProps) {
  const [companiesOpen, setCompaniesOpen] = useState(true);

  return (
    <PanelShell
      title="Associations"
      onClose={onClose}
      right={
        <button
          onClick={() => onNotify('Manage associations')}
          className="text-[#64748B] hover:text-[#2563EB] font-medium flex items-center gap-1 transition"
        >
          <FaArrowUpRightFromSquare className="text-[10px]" />
          <span>Manage associations</span>
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white shadow-sm">
          <button
            onClick={() => setCompaniesOpen((v) => !v)}
            className="w-full bg-[#F8FAFC] px-3 py-2.5 flex items-center justify-between font-bold text-[#1E293B] text-xs hover:bg-[#F1F5F9] transition"
          >
            <span>Companies ({companies.length})</span>
            <span className="flex items-center space-x-2">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddCompany();
                }}
                className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-[11px] bg-[#2563EB1A] px-2 py-0.5 rounded hover:bg-blue-100 transition"
              >
                + Add
              </span>
              {companiesOpen ? (
                <FaChevronUp className="text-[10px] text-[#64748B]" />
              ) : (
                <FaChevronDown className="text-[10px] text-[#64748B]" />
              )}
            </span>
          </button>

          {companiesOpen && (
            <div className="p-3 border-t border-[#E2E8F0]">
              {companies.length === 0 ? (
                <div className="text-center text-xs text-[#64748B] py-6">
                  <div className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mx-auto mb-2">
                    <FaGlobe className="text-sm" />
                  </div>
                  <p>No Company associated</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {companies.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border border-[#E2E8F0] rounded-lg p-2.5">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1E293B] text-xs truncate">{c.name}</p>
                          {c.email && (
                            <p className="text-[10px] text-[#64748B] truncate flex items-center gap-1">
                              <FaRegEnvelope className="text-[9px]" /> {c.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveCompany(c.id)}
                        className="text-[#94A3B8] hover:text-red-500 p-1 flex-shrink-0"
                        title="Remove association"
                      >
                        <FaRegTrashCan className="text-[10px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={onOpenAddCompany}
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-md text-xs font-semibold text-[#1E293B] shadow-sm transition"
                >
                  Create new
                </button>
                <button
                  onClick={() => onNotify('Linking existing company...')}
                  className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md text-xs font-semibold shadow-sm transition"
                >
                  Link existing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  );
}

/* ============================================================
   ADD NEW COMPANY DRAWER (Image 4)
   ============================================================ */

interface AddCompanyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (company: Omit<Company, 'id'>) => void;
}

function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <input
          type="text"
          value={open ? query : value}
          placeholder={placeholder}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            if (open) setOpen(false);
          }}
          className={`${inputCls} pr-8`}
        />
        <FaChevronDown className="absolute right-3 top-2.5 text-[10px] text-[#64748B] pointer-events-none" />
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#94A3B8]">No results found</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(c);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition ${
                  c === value ? 'bg-[#2563EB1A] text-[#2563EB] font-semibold' : 'text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                {c}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AddCompanyDrawer({ open, onClose, onSave }: AddCompanyDrawerProps) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    state: '',
    city: '',
    description: '',
    postalCode: '',
    country: 'Pakistan',
  });
  const contactRowIdRef = useRef(2);
  const [phoneRows, setPhoneRows] = useState<{ id: number; value: string }[]>([{ id: 1, value: '' }]);
  const [emailRows, setEmailRows] = useState<{ id: number; value: string }[]>([{ id: 1, value: '' }]);

  if (!open) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const addPhoneRow = () => setPhoneRows((prev) => [...prev, { id: contactRowIdRef.current++, value: '' }]);
  const removePhoneRow = (id: number) =>
    setPhoneRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev.map((r) => (r.id === id ? { ...r, value: '' } : r))
    );
  const updatePhoneRow = (id: number, value: string) =>
    setPhoneRows((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));

  const addEmailRow = () => setEmailRows((prev) => [...prev, { id: contactRowIdRef.current++, value: '' }]);
  const removeEmailRow = (id: number) =>
    setEmailRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev.map((r) => (r.id === id ? { ...r, value: '' } : r))
    );
  const updateEmailRow = (id: number, value: string) =>
    setEmailRows((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));

  const save = () => {
    if (!form.name.trim()) return;
    const phoneJoined = phoneRows.map((r) => r.value.trim()).filter(Boolean).join(', ');
    const emailJoined = emailRows.map((r) => r.value.trim()).filter(Boolean).join(', ');
    onSave({ ...form, phone: phoneJoined, email: emailJoined });
  };

  return (
    <div className="absolute inset-0 z-[85] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-[400px] max-w-[92vw] h-full bg-white shadow-2xl flex flex-col translate-x-0 animate-[eveeSlideLeft_0.3s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="px-4 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2563EB1A] border border-[#93C5FD] flex items-center justify-center text-[#2563EB]">
              <FaCirclePlus className="text-sm" />
            </div>
            <h3 className="font-bold text-[#1E293B] text-sm">Add new Company</h3>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] transition">
            <FaXmark className="text-sm" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <FieldLabel label="Company Name" required />
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Please input company name"
              className={inputCls}
            />
          </div>

          <div>
            <FieldLabel label="Phone" />
            <div className="space-y-2">
              {phoneRows.map((row, idx) => (
                <div key={row.id} className="flex items-center gap-2">
                  {idx === 0 ? (
                    <div className="flex gap-2 flex-1 min-w-0">
                      <div className="relative w-[86px] flex-shrink-0">
                        <select
                          className={`${inputCls} appearance-none pr-6`}
                          defaultValue="+92"
                          aria-label="Country code"
                        >
                          {countryCodes.map((cc, cIdx) => (
                            <option key={cIdx} value={cc.code}>
                              {cc.flag} {cc.code}
                            </option>
                          ))}
                        </select>
                        <FaChevronDown className="absolute right-2 top-2.5 text-[10px] text-[#64748B] pointer-events-none" />
                      </div>
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => updatePhoneRow(row.id, e.target.value)}
                        placeholder="0301 2345678"
                        className={`${inputCls} flex-1 min-w-0`}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updatePhoneRow(row.id, e.target.value)}
                      placeholder="Phone number"
                      className={`${inputCls} flex-1 min-w-0`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoneRow(row.id)}
                    className="text-[#94A3B8] hover:text-red-500 p-1 flex-shrink-0"
                    aria-label="Remove phone"
                  >
                    <FaRegTrashCan className="text-[10px]" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addPhoneRow}
              className="mt-2 text-[#2563EB] hover:text-[#1D4ED8] text-[11px] font-semibold flex items-center gap-1"
            >
              <FaPlus className="text-[10px]" /> Add phone
            </button>
          </div>

          <div>
            <FieldLabel label="Email" />
            <div className="space-y-2">
              {emailRows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <FaRegEnvelope className="absolute left-3 top-2.5 text-xs text-[#94A3B8]" />
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateEmailRow(row.id, e.target.value)}
                      placeholder="Please input"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEmailRow(row.id)}
                    className="text-[#94A3B8] hover:text-red-500 p-1 flex-shrink-0"
                    aria-label="Remove email"
                  >
                    <FaRegTrashCan className="text-[10px]" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEmailRow}
              className="mt-2 text-[#2563EB] hover:text-[#1D4ED8] text-[11px] font-semibold flex items-center gap-1"
            >
              <FaPlus className="text-[10px]" /> Add email
            </button>
          </div>

          <div>
            <FieldLabel label="Website" />
            <div className="relative">
              <FaGlobe className="absolute left-3 top-2.5 text-xs text-[#94A3B8]" />
              <input type="text" value={form.website} onChange={set('website')} placeholder="Please input" className={`${inputCls} pl-8`} />
            </div>
          </div>

          <div>
            <FieldLabel label="Address" />
            <div className="relative">
              <FaLocationDot className="absolute left-3 top-2.5 text-xs text-[#94A3B8]" />
              <input type="text" value={form.address} onChange={set('address')} placeholder="Please input" className={`${inputCls} pl-8`} />
            </div>
          </div>

          <div>
            <FieldLabel label="State" />
            <input type="text" value={form.state} onChange={set('state')} placeholder="Please input" className={inputCls} />
          </div>

          <div>
            <FieldLabel label="City" />
            <input type="text" value={form.city} onChange={set('city')} placeholder="Please input" className={inputCls} />
          </div>

          <div>
            <FieldLabel label="Description" />
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Please input"
              rows={3}
              className={`${inputCls} resize-y min-h-[80px]`}
            />
          </div>

          <div>
            <FieldLabel label="Postal Code" />
            <input type="text" value={form.postalCode} onChange={set('postalCode')} placeholder="Please input" className={inputCls} />
          </div>

          <div>
            <FieldLabel label="Country" />
            <SearchableSelect
              value={form.country}
              options={COUNTRIES}
              onChange={(v) => setForm((prev) => ({ ...prev, country: v }))}
              placeholder="Please input"
            />
          </div>
        </div>

        <div className="px-5 py-3.5 bg-white border-t border-[#E2E8F0] flex items-center justify-end space-x-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#1E293B] text-xs font-semibold rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-sm transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NOTES DRAWER PANEL (Image 2)
   ============================================================ */
interface NotesDrawerProps {
  notes: Note[];
  onClose: () => void;
  onAddNote: () => void;
  onDeleteNote: (id: number) => void;
}

export function NotesDrawer({ notes, onClose, onAddNote, onDeleteNote }: NotesDrawerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => notes.filter((n) => (n.title + ' ' + (n.content ?? '')).toLowerCase().includes(search.toLowerCase())),
    [notes, search]
  );

  return (
    <PanelShell
      title="Notes"
      onClose={onClose}
      right={
        <button onClick={onAddNote} className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1 transition">
          <span className="text-sm leading-none">+</span> Add
        </button>
      }
    >
      <div className="p-3 border-b border-[#E2E8F0] bg-white flex-shrink-0">
        <div className="relative flex items-center">
          <FaMagnifyingGlass className="absolute left-3 text-[#94A3B8] text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes"
            className="w-full pl-8 pr-9 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs focus:outline-none focus:border-[#2563EB] placeholder-[#94A3B8]"
          />
          <FaSliders className="absolute right-3 text-[#94A3B8] text-xs cursor-pointer hover:text-[#2563EB]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 h-full">
            <div className="w-14 h-14 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mb-4 shadow-sm">
              <FaRegPenToSquare className="text-lg" />
            </div>
            <h4 className="font-bold text-[#1E293B] text-sm mb-1">No notes yet</h4>
            <p className="text-[11px] text-[#64748B] mb-4 max-w-[220px] leading-relaxed">
              Keep track of important details by adding your first note
            </p>
            <button
              onClick={onAddNote}
              className="px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-md text-xs font-semibold text-[#1E293B] shadow-sm transition"
            >
              Add note
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                className="border border-[#E2E8F0] rounded-lg p-3 shadow-sm space-y-2 hover:border-[#93C5FD] transition"
                style={{ backgroundColor: n.note_color && n.note_color !== '#FFFFFF' ? n.note_color : '#FFFFFF' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E293B] text-xs">{n.title}</span>
                  <span className="text-[10px] text-[#94A3B8]">{n.created_at ? n.created_at.slice(0, 16) : ''}</span>
                </div>
                {n.content && (
                  <p
                    className="text-xs text-[#475569] leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: n.content }}
                  />
                )}
                {n.attachments && n.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {n.attachments.map((att, i) => (
                      <span
                        key={`${att}-${i}`}
                        className="inline-flex items-center gap-1 bg-white border border-[#E2E8F0] rounded px-1.5 py-0.5 text-[10px] text-[#475569]"
                      >
                        <FaPaperclip className="text-[8px] text-[#94A3B8]" />
                        {att}
                      </span>
                    ))}
                  </div>
                )}
                {n.associated_to && (
                  <div className="text-[10px] text-[#2563EB] font-medium">
                    Associated to: {n.associated_to}
                  </div>
                )}
                <div className="text-[10px] text-[#94A3B8] pt-1 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span>By {n.author}</span>
                  <button onClick={() => onDeleteNote(n.id)} className="text-[#94A3B8] hover:text-red-500">
                    <FaRegTrashCan />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}

/* ============================================================
   TASKS DRAWER PANEL
   ============================================================ */
interface TasksDrawerProps {
  tasks: TaskItem[];
  onClose: () => void;
  onAddTask: () => void;
  onDeleteTask: (id: number) => void;
  onNotify: (msg: string) => void;
}

export function TasksDrawer({ tasks, onClose, onAddTask, onDeleteTask, onNotify }: TasksDrawerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase())),
    [tasks, search]
  );

  return (
    <PanelShell
      title="Tasks"
      onClose={onClose}
      right={
        <button onClick={onAddTask} className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1 transition">
          <span className="text-sm leading-none">+</span> Add
        </button>
      }
    >
      <div className="p-3 border-b border-[#E2E8F0] bg-white flex-shrink-0">
        <div className="relative flex items-center">
          <FaMagnifyingGlass className="absolute left-3 text-[#94A3B8] text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title"
            className="w-full pl-8 pr-9 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs focus:outline-none focus:border-[#2563EB] placeholder-[#94A3B8]"
          />
          <FaSliders className="absolute right-3 text-[#94A3B8] text-xs cursor-pointer hover:text-[#2563EB]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 h-full">
            <div className="w-14 h-14 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mb-4 shadow-sm">
              <FaRegPenToSquare className="text-lg" />
            </div>
            <h4 className="font-bold text-[#1E293B] text-sm mb-1">No tasks yet</h4>
            <p className="text-[11px] text-[#64748B] mb-4 max-w-[220px] leading-relaxed">
              Create tasks to keep track of everything you need to do
            </p>
            <button
              onClick={onAddTask}
              className="px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-md text-xs font-semibold text-[#1E293B] shadow-sm transition"
            >
              Add task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <div key={t.id} className="bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-sm space-y-2 hover:border-[#93C5FD] transition relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onNotify('Task status updated')}
                      className="w-4 h-4 rounded-full border border-[#CBD5E1] flex items-center justify-center text-[10px] text-emerald-600 hover:border-emerald-500"
                    >
                      ✓
                    </button>
                    <span className="font-semibold text-[#1E293B] text-xs">{t.status}</span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">
                    XY
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#1E293B] pl-6">{t.title}</p>
                <div className="pl-6 flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                  <div className="flex items-center space-x-1">
                    <FaClock className="text-[10px]" />
                    <span>Due: {t.due_date}</span>
                  </div>
                  <button onClick={() => onDeleteTask(t.id)} className="text-[#94A3B8] hover:text-red-500 p-1">
                    <FaRegTrashCan className="text-[10px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}

/* ============================================================
   CREATE TASK / NOTE DRAWER (Image 3) - shared standardized UI
   ============================================================ */
interface CreateTaskNoteDrawerProps {
  mode: 'task' | 'note';
  open: boolean;
  contactName: string;
  onClose: () => void;
  onSubmit: (
    title: string,
    description: string,
    options?: { dueDate?: string; color?: string; attachments?: string[]; associatedTo?: string }
  ) => void;
  opportunities?: { id: number; name: string }[];
  companies?: { id: number; name: string }[];
}

type AssociateType = 'contact' | 'opportunity' | 'company';

interface AssocItem {
  type: AssociateType;
  label: string;
}

const NOTE_COLORS: { label: string; value: string }[] = [
  { label: 'Default', value: '#FFFFFF' },
  { label: 'Yellow', value: '#FEF9C3' },
  { label: 'Orange', value: '#FFEDD5' },
  { label: 'Green', value: '#DCFCE7' },
  { label: 'Blue', value: '#DBEAFE' },
  { label: 'Purple', value: '#EDE9FE' },
  { label: 'Pink', value: '#FCE7F3' },
  { label: 'Red', value: '#FEE2E2' },
];

const currentDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const currentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export function CreateTaskNoteDrawer({
  mode,
  open,
  contactName,
  onClose,
  onSubmit,
  opportunities = [],
  companies = [],
}: CreateTaskNoteDrawerProps) {
  const staff = useStaff();
  const [title, setTitle] = useState('');
  const [showDescription, setShowDescription] = useState(true);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime);
  const [recurring, setRecurring] = useState(false);
  const [assignee, setAssignee] = useState('');
  const [associateOpen, setAssociateOpen] = useState(false);
  const [associateType, setAssociateType] = useState<AssociateType>('contact');
  const [associateValue, setAssociateValue] = useState('');
  const [associations, setAssociations] = useState<AssocItem[]>([
    { type: 'contact', label: contactName },
  ]);
  const [noteColor, setNoteColor] = useState('#FFFFFF');
  const [noteAttachments, setNoteAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const isTask = mode === 'task';
  const initials = contactName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const addAssociation = () => {
    if (associateType === 'contact') {
      if (!associations.some((a) => a.type === 'contact')) {
        setAssociations((prev) => [...prev, { type: 'contact', label: contactName }]);
      }
    } else if (associateValue) {
      if (!associations.some((a) => a.type === associateType && a.label === associateValue)) {
        setAssociations((prev) => [...prev, { type: associateType, label: associateValue }]);
      }
    }
    setAssociateOpen(false);
    setAssociateValue('');
  };

  const submit = () => {
    if (!title.trim()) return;
    let dueDate: string | undefined;
    if (isTask && date && time) {
      const [hStr, mStr] = time.split(':');
      const h = Number(hStr) || 0;
      const m = Number(mStr) || 0;
      const periodLabel = h >= 12 ? 'PM' : 'AM';
      const h12 = ((h % 12) || 12).toString().padStart(2, '0');
      dueDate = `${date}, ${h12}:${String(m).padStart(2, '0')} ${periodLabel}`;
    }
    const associatedTo =
      associations.find((a) => a.type !== 'contact')?.label ??
      (associations.some((a) => a.type === 'contact') ? contactName : '');
    onSubmit(title.trim(), description, {
      dueDate,
      color: noteColor,
      attachments: noteAttachments,
      associatedTo,
    });
  };

  const handleNoteFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setNoteAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
    }
    e.target.value = '';
  };

  return (
    <div className="absolute inset-0 z-[85] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-[400px] max-w-[92vw] h-full bg-[#F8FAFC] shadow-2xl flex flex-col animate-[eveeSlideLeft_0.3s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="px-4 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-[#1E293B] text-sm">{isTask ? 'Add task' : 'Add note'}</h3>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] transition">
            <FaXmark className="text-sm" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <FieldLabel label="Title" required />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter"
              className={inputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowDescription((v) => !v)}
                className="text-[#2563EB] text-[11px] font-semibold hover:underline flex items-center gap-1"
              >
                <span>{showDescription ? '-' : '+'}</span> {showDescription ? 'Remove description' : 'Add description'}
              </button>
            </div>

            {showDescription && (
              <div className="border border-[#E2E8F0] rounded-md overflow-hidden bg-white">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder={isTask ? 'Enter task description' : 'Enter note description'}
                  minHeight={96}
                  maxLength={2000}
                />
              </div>
            )}
          </div>

          {!isTask && (
            <>
              <div>
                <FieldLabel label="Note color" />
                <div className="flex flex-wrap gap-2">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNoteColor(c.value)}
                      title={c.label}
                      className={`w-7 h-7 rounded-full border transition ${
                        noteColor === c.value
                          ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel label="Attachments" />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleNoteFiles}
                  aria-label="Attach files to note"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${inputCls} flex items-center gap-2 text-left justify-between`}
                >
                  <span className="flex items-center gap-2 text-[#1E293B]">
                    <FaPaperclip className="text-[#64748B] text-xs" />
                    Add attachments
                  </span>
                  <FaChevronDown className="text-[10px] text-[#64748B]" />
                </button>
                {noteAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {noteAttachments.map((name, i) => (
                      <span
                        key={`${name}-${i}`}
                        className="inline-flex items-center gap-1.5 bg-[#2563EB1A] border border-[#93C5FD] rounded-md px-2 py-1 text-[11px] text-[#2563EB] font-medium max-w-full"
                      >
                        <FaPaperclip className="text-[9px] flex-shrink-0" />
                        <span className="truncate">{name}</span>
                        <button
                          onClick={() => setNoteAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-[#2563EB] hover:text-red-500 text-[10px] flex-shrink-0"
                          title="Remove attachment"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {isTask && (
            <>
              <div>
                <FieldLabel label="Due Date and Time (PKT)" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <FaCalendarDays className="absolute left-3 top-2.5 text-[#94A3B8] text-xs pointer-events-none" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  <div className="relative">
                    <FaClock className="absolute left-2.5 top-2.5 text-[#94A3B8] text-[11px] pointer-events-none" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={`${inputCls} pl-7`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-md px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-[#1E293B]">Setup recurring tasks</p>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Repeat this task on a schedule</p>
                </div>
                <button
                  onClick={() => setRecurring((v) => !v)}
                  className={`w-9 h-5 rounded-full transition relative ${recurring ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      recurring ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <FieldLabel label="Assign to" />
                <div className="relative">
                  <FaUser className="absolute left-3 top-2.5 text-[#94A3B8] text-xs pointer-events-none" />
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className={`${inputCls} pl-8 appearance-none pr-8`}
                  >
                    <option value="">Select assignee</option>
                    {staff.staff.map((s) => (
                      <option key={s.id} value={s.full_name}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-2.5 text-[10px] text-[#64748B] pointer-events-none" />
                </div>
              </div>
            </>
          )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#1E293B]">
                    Associated objects
                    <span className="relative group">
                      <FaRegPenToSquare className="text-[10px] text-[#94A3B8]" />
                    </span>
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setAssociateOpen((v) => !v)}
                      className="text-[#2563EB] text-[11px] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span className="text-sm leading-none">+</span> Associate to
                    </button>
                    {associateOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setAssociateOpen(false)} />
                        <div className="absolute right-0 top-6 z-30 w-60 bg-white border border-[#E2E8F0] rounded-lg shadow-xl p-3 space-y-2.5">
                          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">
                            Associate to
                          </p>
                          <div className="space-y-1">
                            {(
                              [
                                { id: 'contact', label: 'Contact' },
                                { id: 'opportunity', label: 'Opportunity' },
                                { id: 'company', label: 'Company' },
                              ] as { id: AssociateType; label: string }[]
                            ).map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setAssociateType(opt.id);
                                  setAssociateValue('');
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition ${
                                  associateType === opt.id
                                    ? 'bg-[#2563EB1A] text-[#2563EB] font-semibold'
                                    : 'text-[#1E293B] hover:bg-[#F1F5F9]'
                                }`}
                              >
                                <span
                                  className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                    associateType === opt.id ? 'border-[#2563EB]' : 'border-[#CBD5E1]'
                                  }`}
                                >
                                  {associateType === opt.id && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                                  )}
                                </span>
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {associateType === 'contact' && (
                            <div className="text-xs text-[#1E293B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-2.5 py-2 truncate">
                              {contactName}
                            </div>
                          )}

                          {associateType === 'opportunity' && (
                            <select
                              value={associateValue}
                              onChange={(e) => setAssociateValue(e.target.value)}
                              className={`${inputCls} appearance-none`}
                            >
                              <option value="">Select opportunity</option>
                              {opportunities.map((o) => (
                                <option key={o.id} value={o.name}>
                                  {o.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {associateType === 'company' && (
                            <select
                              value={associateValue}
                              onChange={(e) => setAssociateValue(e.target.value)}
                              className={`${inputCls} appearance-none`}
                            >
                              <option value="">Select company</option>
                              {companies.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            onClick={addAssociation}
                            className="w-full px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md transition"
                          >
                            Associate
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {associations.length === 0 && (
                    <span className="text-[11px] text-[#94A3B8]">No objects associated</span>
                  )}
                  {associations.map((a, i) => (
                    <span
                      key={`${a.type}-${a.label}-${i}`}
                      className="inline-flex items-center space-x-1.5 bg-[#2563EB1A] border border-[#93C5FD] rounded-md px-2 py-1 text-[11px] text-[#2563EB] font-medium"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                        {a.type === 'contact' ? initials || 'CT' : a.type === 'opportunity' ? 'OP' : 'CO'}
                      </span>
                      <span className="truncate max-w-[180px]">{a.label}</span>
                      <button
                        onClick={() => setAssociations((prev) => prev.filter((_, idx) => idx !== i))}
                        className="hover:text-red-500 text-[10px] flex-shrink-0"
                        title="Remove association"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
        </div>

        <div className="px-5 py-3.5 bg-white border-t border-[#E2E8F0] flex items-center justify-end space-x-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#1E293B] text-xs font-semibold rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-sm transition"
          >
            {isTask ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
