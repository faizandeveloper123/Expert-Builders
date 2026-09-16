import { useEffect, useRef, useState } from 'react';
import {
  FaArrowLeft,
  FaCheck,
  FaChevronDown,
  FaCircleCheck,
  FaMinus,
  FaPlus,
  FaRegTrashCan,
  FaRegCalendar,
  FaChevronUp,
} from 'react-icons/fa6';
import { useStaff } from '../StaffContext';

interface NewBookingModalProps {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  onClose: () => void;
  onSave: (data: {
    title: string;
    calendar: string;
    host: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    status: string;
    notes: string;
    category: string;
  }) => Promise<void>;
}

interface Listing {
  id: number;
  listing: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  qty: number;
  price: string;
  duration: string;
  collapsed: boolean;
}

interface ContactRow {
  id: number;
  value: string;
}

const selectCls =
  'w-full px-3 py-2 bg-[#FAFAFA] border border-slate-200 hover:border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-[0_0_0_2px_rgba(59,130,246,0.15)] appearance-none pr-8 focus:ring-0';
const inputCls =
  'w-full px-3 py-2 bg-[#FAFAFA] border border-slate-200 hover:border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500';
const labelCls = 'block text-xs text-slate-500 mb-1';

const listingOptions = [
  { id: '', name: 'Select listing' },
  { id: '1', name: 'Executive Suite - Ocean View' },
  { id: '2', name: 'Standard Deluxe Room' },
  { id: '3', name: 'Conference Hall A' },
  { id: '4', name: 'VIP Private Studio' },
];

const startTimes = ['', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
const endTimes = ['', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '17:00'];

function formatTimeLabel(v: string): string {
  if (!v) return '';
  const [hStr, mStr] = v.split(':');
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h % 12) || 12).toString().padStart(2, '0');
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function ChevronDownIcon({ className = 'text-slate-400 text-xs' }: { className?: string }) {
  return <FaChevronDown className={`absolute right-3 top-3 pointer-events-none ${className}`} />;
}

function NewBookingModal({ contactName, contactPhone, contactEmail, onClose, onSave }: NewBookingModalProps) {
  const staff = useStaff();
  const listingIdRef = useRef(1);
  const [status, setStatus] = useState('Booked');
  const [eventType, setEventType] = useState('Booking');
  const [host, setHost] = useState('');
  const [name, setName] = useState(contactName);
  const contactRowIdRef = useRef(2);
  const [phoneRows, setPhoneRows] = useState<ContactRow[]>([{ id: 1, value: contactPhone || '+92 (305) 278-9972' }]);
  const [emailRows, setEmailRows] = useState<ContactRow[]>([{ id: 1, value: contactEmail || '' }]);
  const [notes, setNotes] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    setName(contactName);
    setPhoneRows([{ id: 1, value: contactPhone || '+92 (305) 278-9972' }]);
    setEmailRows([{ id: 1, value: contactEmail || '' }]);
    setStatus('Booked');
    setEventType('Booking');
    setNotes('');
    setListings([]);
    setSuccess(null);
  }, [contactName, contactPhone, contactEmail]);

  useEffect(() => {
    if (listings.length === 0) addListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addListing = () => {
    const id = listingIdRef.current++;
    setListings((prev) => [
      ...prev,
      { id, listing: '', startDate: '', startTime: '', endDate: '', endTime: '', qty: 1, price: '0', duration: '', collapsed: false },
    ]);
  };

  const updateListing = (id: number, patch: Partial<Listing>) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeListing = (id: number) => {
    setListings((prev) => {
      if (prev.length <= 1) {
        return prev.map((l) =>
          l.id === id
            ? { id, listing: '', startDate: '', startTime: '', endDate: '', endTime: '', qty: 1, price: '0', duration: '', collapsed: false }
            : l
        );
      }
      return prev.filter((l) => l.id !== id);
    });
  };

  const toggleCollapse = (id: number) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, collapsed: !l.collapsed } : l)));
  };

  const calculateDuration = (id: number) => {
    const l = listings.find((x) => x.id === id);
    if (!l) return;
    if (!l.startDate || !l.endDate) return;
    const start = new Date(`${l.startDate}T${l.startTime || '00:00'}`);
    const end = new Date(`${l.endDate}T${l.endTime || '00:00'}`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs > 0) {
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const remHours = totalHours % 24;
      let str = '';
      if (days > 0) str += `${days} day${days > 1 ? 's' : ''} `;
      if (remHours > 0 || days === 0) str += `${remHours} hr${remHours !== 1 ? 's' : ''}`;
      updateListing(id, { duration: str.trim() });
    } else if (diffMs === 0) {
      updateListing(id, { duration: '0 hrs' });
    }
  };

  const changeQty = (id: number, delta: number) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, (l.qty || 1) + delta) } : l))
    );
  };

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

  const submit = async () => {
    setSaving(true);
    try {
      const joinedPhones = phoneRows.map((r) => r.value.trim()).filter(Boolean).join(', ');
      const joinedEmails = emailRows.map((r) => r.value.trim()).filter(Boolean).join(', ');
      const first = listings[0];
      const date = first?.startDate || '';
      const title = eventType === 'Blocked slot' ? 'Blocked Slot - Rental' : `${name} - ${eventType}`;
      await onSave({
        title,
        calendar: 'General Support Calendar',
        host: host || 'Asad B Zaman',
        date,
        start_time: first?.startTime ? formatTimeLabel(first.startTime) : '09:00 AM',
        end_time: first?.endTime ? formatTimeLabel(first.endTime) : '05:00 PM',
        location: 'Rental',
        status,
        notes:
          notes ||
          `Event: ${eventType} | Customer: ${name} (${joinedPhones}, ${joinedEmails}) | Listings: ${listings.length}`,
        category: 'past',
      });
      setSuccess({
        Status: status.toUpperCase(),
        'Event Type': eventType,
        Customer: `${name} (${joinedPhones}, ${joinedEmails})`,
        'Listings Count': String(listings.length),
        Notes: notes || '—',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white w-[1200px] max-w-[96vw] max-h-[94vh] rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* TOP HEADER BAR */}
        <header className="px-4 sm:px-6 py-2.5 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center w-1/4">
            <button onClick={onClose} className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Go back">
              <FaArrowLeft className="text-lg" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center w-2/4 text-center">
            <h1 className="text-base font-medium text-slate-900 leading-tight">New booking</h1>
            <p className="text-xs text-slate-500 font-normal">Pakistan Standard Time (GMT +05:00)</p>
          </div>

          <div className="flex items-center justify-end gap-3 w-1/4">
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-medium py-1.5 pl-8 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Booked">Booked</option>
                <option value="Unconfirmed">Unconfirmed</option>
              </select>
              <FaCheck className="text-blue-600 text-xs absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <FaChevronDown className="text-slate-400 text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={submit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <FaCheck className="text-xs" />
              <span>{saving ? 'Creating...' : 'Create booking'}</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-6 overflow-y-auto">
          {/* EVENT TYPE */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-2">Event type</label>
              <div className="relative max-w-sm">
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={`${selectCls} w-full bg-[#FAFAFA]`}>
                  <option value="Booking">Booking</option>
                  <option value="Blocked slot">Blocked slot</option>
                </select>
                <ChevronDownIcon />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-2">Assign Host</label>
              <div className="relative max-w-sm">
                <select value={host} onChange={(e) => setHost(e.target.value)} className={`${selectCls} w-full bg-[#FAFAFA]`}>
                  <option value="">Select staff user</option>
                  {staff.staff.map((s) => (
                    <option key={s.id} value={s.full_name}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-9 space-y-6">
              {/* CUSTOMER DETAILS */}
              <section>
                <h2 className="text-xs font-semibold text-slate-900 mb-3">Customer details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${inputCls} pr-8`}
                      />
                      <FaChevronDown className="absolute right-3 top-3 text-slate-400 text-xs pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <div className="space-y-2">
                      {phoneRows.map((row) => (
                        <div key={row.id} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={row.value}
                            onChange={(e) => updatePhoneRow(row.id, e.target.value)}
                            placeholder="Phone number"
                            className={`${inputCls} flex-1 min-w-0`}
                          />
                          <button
                            type="button"
                            onClick={() => removePhoneRow(row.id)}
                            className="text-slate-400 hover:text-slate-600 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100 flex-shrink-0"
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
                      <FaPlus className="text-[10px]" />
                      <span>Add phone</span>
                    </button>
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <div className="space-y-2">
                      {emailRows.map((row) => (
                        <div key={row.id} className="flex items-center gap-1.5">
                          <input
                            type="email"
                            value={row.value}
                            onChange={(e) => updateEmailRow(row.id, e.target.value)}
                            placeholder="Email address"
                            className={`${inputCls} flex-1 min-w-0`}
                          />
                          <button
                            type="button"
                            onClick={() => removeEmailRow(row.id)}
                            className="text-slate-400 hover:text-slate-600 p-1.5 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100 flex-shrink-0"
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
                      <FaPlus className="text-[10px]" />
                      <span>Add email</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* LISTINGS */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-slate-900">Listings</h2>
                  <button
                    type="button"
                    onClick={addListing}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                  >
                    <FaPlus className="text-[10px]" />
                    <span>New listing</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {listings.map((l) => (
                    <div key={l.id} className="bg-slate-50/60 border border-slate-200 rounded-lg p-4 sm:p-5 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-500">Listing #{l.id}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeListing(l.id)}
                            className="text-slate-400 hover:text-red-500 text-xs p-1 rounded transition-colors"
                            title="Remove listing"
                          >
                            <FaRegTrashCan />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCollapse(l.id)}
                            className="text-slate-500 hover:text-slate-800 text-xs p-1 rounded"
                            title="Toggle collapse"
                          >
                            <FaChevronUp className={`transition-transform ${l.collapsed ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className={`space-y-4 ${l.collapsed ? 'hidden' : ''}`}>
                        <div>
                          <label className={labelCls}>Select listing</label>
                          <div className="relative">
                            <select
                              value={l.listing}
                              onChange={(e) => updateListing(l.id, { listing: e.target.value })}
                              className={selectCls}
                            >
                              {listingOptions.map((o) => (
                                <option key={o.id} value={o.id} disabled={o.id === ''}>
                                  {o.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDownIcon />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className={labelCls}>Start date</label>
                            <div className="relative">
                              <input
                                type="date"
                                value={l.startDate}
                                onChange={(e) => updateListing(l.id, { startDate: e.target.value })}
                                onBlur={() => calculateDuration(l.id)}
                                className={`${inputCls} pr-8`}
                              />
                              <FaRegCalendar className="text-slate-400 text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Start time</label>
                            <div className="relative">
                              <select
                                value={l.startTime}
                                onChange={(e) => updateListing(l.id, { startTime: e.target.value })}
                                onBlur={() => calculateDuration(l.id)}
                                className={selectCls}
                              >
                                {startTimes.map((t) => (
                                  <option key={t} value={t}>
                                    {formatTimeLabel(t) || 'Select'}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon />
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>End date</label>
                            <div className="relative">
                              <input
                                type="date"
                                value={l.endDate}
                                onChange={(e) => updateListing(l.id, { endDate: e.target.value })}
                                onBlur={() => calculateDuration(l.id)}
                                className={`${inputCls} pr-8`}
                              />
                              <FaRegCalendar className="text-slate-400 text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>End time</label>
                            <div className="relative">
                              <select
                                value={l.endTime}
                                onChange={(e) => updateListing(l.id, { endTime: e.target.value })}
                                onBlur={() => calculateDuration(l.id)}
                                className={selectCls}
                              >
                                {endTimes.map((t) => (
                                  <option key={t} value={t}>
                                    {formatTimeLabel(t) || 'Select'}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className={labelCls}>Quantity</label>
                            <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden px-2 py-0.5 focus-within:bg-white focus-within:border-blue-500">
                              <input
                                type="number"
                                value={l.qty}
                                min={1}
                                onChange={(e) => updateListing(l.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                                className="w-full py-1 text-sm text-slate-800 bg-transparent focus:outline-none"
                              />
                              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                                <button type="button" onClick={() => changeQty(l.id, -1)} className="text-slate-400 hover:text-slate-600 px-1 py-0.5 text-xs">
                                  <FaMinus />
                                </button>
                                <button type="button" onClick={() => changeQty(l.id, 1)} className="text-slate-400 hover:text-slate-600 px-1 py-0.5 text-xs">
                                  <FaPlus />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Price</label>
                            <div className="flex items-center bg-white border border-slate-200 rounded-md px-3 py-1.5 focus-within:bg-white focus-within:border-blue-500">
                              <span className="text-sm text-slate-500 mr-2">$</span>
                              <input
                                type="number"
                                value={l.price}
                                min={0}
                                onChange={(e) => updateListing(l.id, { price: e.target.value })}
                                className="w-full text-sm text-slate-800 bg-transparent focus:outline-none"
                              />
                              <span className="text-xs text-slate-400 font-normal ml-2">USD</span>
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Duration</label>
                            <input type="text" value={l.duration} readOnly placeholder="" className={`${inputCls} bg-white`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
              <section>
                <h2 className="text-xs font-semibold text-slate-900 mb-3">Add internal notes</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Add an internal note"
                  className={`${inputCls} w-full rounded-lg p-3 placeholder-slate-400 resize-y min-h-[120px]`}
                />
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* SUCCESS MODAL */}
      {success && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <FaCircleCheck className="text-xl" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Booking Created Successfully</h3>
                <p className="text-xs text-slate-500">All details have been submitted.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 space-y-2 border border-slate-200">
              {Object.entries(success).map(([k, v]) => (
                <p key={k}>
                  <strong>{k}:</strong> {v}
                </p>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewBookingModal;