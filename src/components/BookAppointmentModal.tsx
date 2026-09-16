import { useState } from 'react';
import { FaChevronDown, FaCheck, FaRegCalendarCheck, FaRegCreditCard, FaXmark } from 'react-icons/fa6';
import { useStaff } from '../StaffContext';

interface BookAppointmentModalProps {
  contactName: string;
  phone: string;
  onClose: () => void;
  onSave: (data: Record<string, string>) => Promise<void>;
}

const selectCls =
  'w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500 appearance-none';
const inputCls =
  'w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500';
const labelCls = 'block text-[11px] font-semibold text-slate-700 mb-1';

function Chevron() {
  return <FaChevronDown className="absolute right-3 top-2.5 text-[10px] text-slate-400 pointer-events-none" />;
}

function BookAppointmentModal({ contactName, phone, onClose, onSave }: BookAppointmentModalProps) {
  const staff = useStaff();
  const [form, setForm] = useState({
    title: 'Test Ride & Sales Consultation',
    calendar: 'Sales Consultation Calendar',
    user: 'Asad B Zaman',
    duration: '30 Mins',
    date: '2026-08-08',
    start_time: '10:00 AM',
    end_time: '10:30 AM',
    timezone: '(GMT+05:00) Pakistan Standard Time (PKT)',
    location: 'Google Meet Video Link',
    notes: 'Customer requested a test ride for Evee electric scooter model.',
    status: 'Completed',
    send_invite: '1',
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const slotBtn = (label: string) => (
    <label className="flex-1 cursor-pointer">
      <input
        type="radio"
        name="slot-type"
        value={label}
        checked={form.duration === label}
        onChange={set('duration')}
        className="peer hidden"
      />
      <div className="py-1.5 text-center text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-md peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 transition">
        {label}
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white w-[840px] max-w-[95vw] max-h-[90vh] rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Book Appointment</h3>
            <p className="text-xs text-slate-500 mt-0.5">Schedule a meeting or appointment with contact</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <FaXmark className="text-lg" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="w-52 bg-slate-50/70 border-r border-slate-200 p-3 flex flex-col justify-between flex-shrink-0">
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 bg-blue-50 text-blue-700 font-semibold rounded-md text-xs flex items-center justify-between border border-blue-100 shadow-sm">
                <span className="flex items-center gap-2">
                  <FaRegCalendarCheck className="text-blue-600" />
                  Appointment details
                </span>
                <FaCheck className="text-[10px] text-blue-600" />
              </button>
              <button className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-md text-xs flex items-center justify-between transition">
                <span className="flex items-center gap-2">
                  <FaRegCreditCard className="text-slate-400" />
                  Payment details
                </span>
              </button>
            </div>

            <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800 block mb-0.5">Contact:</span>
              <p className="truncate font-semibold text-blue-600">{contactName}</p>
              <p className="text-[10px] text-slate-500 truncate">{phone || 'No phone'}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label className={labelCls}>
                Event / Appointment Title <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.title} onChange={set('title')} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Calendar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select value={form.calendar} onChange={set('calendar')} className={selectCls}>
                    <option value="Sales Consultation Calendar">Sales Consultation Calendar</option>
                    <option value="Evee Test Ride Calendar">Evee Test Ride Calendar</option>
                    <option value="General Support Calendar">General Support Calendar</option>
                  </select>
                  <Chevron />
                </div>
              </div>
              <div>
                <label className={labelCls}>Assign User / Host</label>
                <div className="relative">
                  <select value={form.user} onChange={set('user')} className={selectCls}>
                    {staff.staff.map((s) => (
                      <option key={s.id} value={s.full_name}>
                        {s.full_name}
                      </option>
                    ))}
                    <option value="Unassigned">Unassigned</option>
                  </select>
                  <Chevron />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Slot Duration</label>
              <div className="flex items-center gap-2">
                {slotBtn('30 Mins')}
                {slotBtn('60 Mins')}
                {slotBtn('Custom')}
              </div>
            </div>

            <hr className="border-slate-200 my-4" />

            <div>
              <label className={labelCls}>
                Date & Time <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input type="date" value={form.date} onChange={set('date')} className={inputCls} />
                </div>
                <div className="relative">
                  <select value={form.start_time} onChange={set('start_time')} className={selectCls}>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                  <Chevron />
                </div>
                <div className="relative">
                  <select value={form.end_time} onChange={set('end_time')} className={selectCls}>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                  <Chevron />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Timezone</label>
              <div className="relative">
                <select value={form.timezone} onChange={set('timezone')} className={selectCls}>
                  <option value="(GMT+05:00) Pakistan Standard Time (PKT)">(GMT+05:00) Pakistan Standard Time (PKT)</option>
                  <option value="(GMT+00:00) UTC">(GMT+00:00) UTC</option>
                  <option value="(GMT-05:00) EST">(GMT-05:00) Eastern Time (US & Canada)</option>
                </select>
                <Chevron />
              </div>
            </div>

            <div>
              <label className={labelCls}>Meeting Location</label>
              <div className="relative">
                <select value={form.location} onChange={set('location')} className={selectCls}>
                  <option value="Google Meet Video Link">Google Meet Video Link</option>
                  <option value="In-Person Showroom Visit">In-Person Showroom Visit</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Zoom Meeting">Zoom Meeting</option>
                </select>
                <Chevron />
              </div>
            </div>

            <div>
              <label className={labelCls}>Description / Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputCls} />
            </div>

            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                checked={form.send_invite === '1'}
                onChange={(e) => setForm((p) => ({ ...p, send_invite: e.target.checked ? '1' : '0' }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label className="text-xs font-medium text-slate-700 cursor-pointer">
                Send email calendar invite to contact
              </label>
            </div>

            <div>
              <label className={labelCls}>Appointment Status</label>
              <div className="relative">
                <select value={form.status} onChange={set('status')} className={selectCls}>
                  <option value="Completed">Completed / Showed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
                <Chevron />
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
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <FaCheck className="text-[10px]" />
            <span>{saving ? 'Booking...' : 'Book Appointment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookAppointmentModal;
