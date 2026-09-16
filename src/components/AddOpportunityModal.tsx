import { useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaGear, FaPlus, FaRegTrashCan, FaXmark } from 'react-icons/fa6';

export interface OpportunityFormData {
  contact_name: string;
  email: string;
  phone: string;
  name: string;
  pipeline: string;
  stage: string;
  status: string;
  value: string;
  business_name: string;
  source: string;
  expected_close_date: string;
  tags: string[];
}

interface AddOpportunityModalProps {
  contactName: string;
  email: string;
  phone: string;
  onClose: () => void;
  onSave: (data: OpportunityFormData) => Promise<void>;
}

interface ContactRow {
  id: number;
  value: string;
}

const selectCls =
  'w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500 appearance-none';
const inputCls =
  'w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500';

const TAG_OPTIONS = ['follow-up', 'high priority', 'warm lead'];

function Chevron() {
  return <FaChevronDown className="absolute right-3 top-2.5 text-[10px] text-slate-400 pointer-events-none" />;
}

function AddOpportunityModal({ contactName, email, phone, onClose, onSave }: AddOpportunityModalProps) {
  const [form, setForm] = useState<OpportunityFormData>({
    contact_name: contactName,
    email,
    phone,
    name: contactName,
    pipeline: 'Marketing Pipeline',
    stage: 'New Lead',
    status: 'Open',
    value: 'Rs 0',
    business_name: 'Evee',
    source: '',
    expected_close_date: '',
    tags: [],
  });
  const rowIdRef = useRef(2);
  const [emailRows, setEmailRows] = useState<ContactRow[]>([{ id: 1, value: email ?? '' }]);
  const [phoneRows, setPhoneRows] = useState<ContactRow[]>([{ id: 1, value: phone ?? '' }]);
  const [saving, setSaving] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof OpportunityFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value } as OpportunityFormData));

  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    if (!q) return TAG_OPTIONS;
    return TAG_OPTIONS.filter((t) => t.toLowerCase().includes(q));
  }, [tagQuery]);

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const addEmailRow = () => setEmailRows((prev) => [...prev, { id: rowIdRef.current++, value: '' }]);
  const removeEmailRow = (id: number) =>
    setEmailRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev.map((r) => (r.id === id ? { ...r, value: '' } : r))
    );
  const updateEmailRow = (id: number, value: string) =>
    setEmailRows((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));

  const addPhoneRow = () => setPhoneRows((prev) => [...prev, { id: rowIdRef.current++, value: '' }]);
  const removePhoneRow = (id: number) =>
    setPhoneRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev.map((r) => (r.id === id ? { ...r, value: '' } : r))
    );
  const updatePhoneRow = (id: number, value: string) =>
    setPhoneRows((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));

  const submit = async () => {
    setSaving(true);
    try {
      const emailJoined = emailRows.map((r) => r.value.trim()).filter(Boolean).join(', ');
      const phoneJoined = phoneRows.map((r) => r.value.trim()).filter(Boolean).join(', ');
      await onSave({ ...form, email: emailJoined, phone: phoneJoined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50" onMouseDown={(e) => { if (e.target === e.currentTarget) setTagMenuOpen(false); }}>
      <div className="bg-white w-[820px] max-w-[95vw] max-h-[90vh] rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Add new opportunity</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Create new opportunity by filling in details and selecting a contact
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <FaXmark className="text-lg" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="w-48 bg-slate-50/60 border-r border-slate-200 p-3 flex flex-col justify-between flex-shrink-0">
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 bg-blue-50 text-blue-600 font-semibold rounded-md text-xs flex items-center justify-between">
                <span>Opportunity details</span>
                <FaChevronDown className="text-[10px]" />
              </button>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 p-2">
              <FaGear className="text-slate-400" />
              <span>Manage fields</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h4 className="font-bold text-slate-800 text-xs mb-3">Contact details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Primary contact name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select value={form.contact_name} onChange={set('contact_name')} className={selectCls}>
                      <option value={contactName}>{contactName}</option>
                      <option value="Muhammad Faizan">Muhammad Faizan</option>
                    </select>
                    <Chevron />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Email</label>
                  <div className="space-y-2">
                    {emailRows.map((row) => (
                      <div key={row.id} className="flex items-center gap-1.5">
                        <input
                          type="email"
                          value={row.value}
                          onChange={(e) => updateEmailRow(row.id, e.target.value)}
                          placeholder="Enter email address"
                          className={`${inputCls} flex-1 min-w-0`}
                        />
                        <button
                          type="button"
                          onClick={() => removeEmailRow(row.id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100 flex-shrink-0"
                          aria-label="Remove email"
                        >
                          <FaRegTrashCan />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addEmailRow}
                    className="mt-1.5 text-blue-600 hover:underline font-medium text-[11px] flex items-center gap-1"
                  >
                    <FaPlus className="text-[9px]" /> Add email
                  </button>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Phone</label>
                  <div className="space-y-2">
                    {phoneRows.map((row) => (
                      <div key={row.id} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => updatePhoneRow(row.id, e.target.value)}
                          placeholder="Enter phone number"
                          className={`${inputCls} flex-1 min-w-0`}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoneRow(row.id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100 flex-shrink-0"
                          aria-label="Remove phone"
                        >
                          <FaRegTrashCan />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addPhoneRow}
                    className="mt-1.5 text-blue-600 hover:underline font-medium text-[11px] flex items-center gap-1"
                  >
                    <FaPlus className="text-[9px]" /> Add phone
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-slate-200 my-5" />

            <div>
              <h4 className="font-bold text-slate-800 text-xs mb-3">Opportunity details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Opportunity name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={form.name} onChange={set('name')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Pipeline</label>
                  <div className="relative">
                    <select value={form.pipeline} onChange={set('pipeline')} className={selectCls}>
                      <option value="Marketing Pipeline">Marketing Pipeline</option>
                      <option value="Sales Pipeline">Sales Pipeline</option>
                    </select>
                    <Chevron />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Stage</label>
                  <div className="relative">
                    <select value={form.stage} onChange={set('stage')} className={selectCls}>
                      <option value="New Lead">New Lead</option>
                      <option value="Hot Lead">Hot Lead</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed Won">Closed Won</option>
                    </select>
                    <Chevron />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Status</label>
                  <div className="relative">
                    <select value={form.status} onChange={set('status')} className={selectCls}>
                      <option value="Open">Open</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                      <option value="Abandoned">Abandoned</option>
                    </select>
                    <Chevron />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Value</label>
                  <input type="text" value={form.value} onChange={set('value')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Business name</label>
                  <input type="text" value={form.business_name} onChange={set('business_name')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={set('source')}
                    placeholder="Enter source"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={form.expected_close_date}
                    onChange={set('expected_close_date')}
                    placeholder="Select Date"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Tags</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setTagMenuOpen((v) => !v);
                        setTagQuery('');
                        if (tagMenuOpen) setTimeout(() => tagInputRef.current?.focus(), 0);
                      }}
                      className={`${inputCls} text-left flex items-center justify-between gap-2`}
                    >
                      <span className={form.tags.length === 0 ? 'text-slate-400' : 'text-slate-800'}>
                        {form.tags.length === 0 ? 'Add tags' : form.tags.join(', ')}
                      </span>
                      <FaChevronDown className="text-[10px] text-slate-400" />
                    </button>
                    {tagMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onMouseDown={() => setTagMenuOpen(false)}
                          aria-hidden="true"
                        />
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-slate-100">
                            <input
                              ref={tagInputRef}
                              type="text"
                              value={tagQuery}
                              onChange={(e) => setTagQuery(e.target.value)}
                              placeholder="Search tags..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto py-1">
                            {filteredTags.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-slate-400">No tags found</div>
                            ) : (
                              filteredTags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    toggleTag(tag);
                                    setTagQuery('');
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 flex items-center justify-between gap-2"
                                >
                                  <span>{tag}</span>
                                  <span
                                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                                      form.tags.includes(tag)
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-slate-300 text-transparent'
                                    }`}
                                  >
                                    ✓
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                          {form.tags.length > 0 && (
                            <div className="px-3 py-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                              {form.tags.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 text-[10px] font-medium"
                                >
                                  {t}
                                  <button type="button" onClick={() => toggleTag(t)} className="hover:text-red-500">
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-end space-x-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddOpportunityModal;