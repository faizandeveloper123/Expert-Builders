import { useMemo, useState } from 'react';
import {
  FaCalendarDays,
  FaChartBar,
  FaChevronDown,
  FaDownload,
  FaEllipsisVertical,
  FaMagnifyingGlass,
} from 'react-icons/fa6';
import { useBulkActions, type BulkActionEntry } from '../data/bulkActionsStore';
import { useStaff } from '../StaffContext';

interface BulkActionRow {
  id: number;
  label: string;
  operation: string;
  status: string;
  user: string;
  userInitials: string;
  createdAtMs: number;
  created: string;
  completed: string;
  stats: 'chart' | 'download';
}

function formatActionTime(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toRow(entry: BulkActionEntry): BulkActionRow {
  return {
    id: entry.id,
    label: entry.label,
    operation: entry.operation,
    status: entry.status,
    user: entry.user,
    userInitials: entry.userInitials,
    createdAtMs: entry.createdAt,
    created: formatActionTime(entry.createdAt),
    completed: formatActionTime(entry.createdAt),
    stats: entry.stats,
  };
}

const filterSelectCls =
  'relative';
const selectBaseCls =
  'w-full min-w-[150px] bg-white border border-slate-300 rounded-md pl-7 pr-7 py-1.5 text-xs text-slate-700 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer';

function FilterSelect({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={filterSelectCls}>
      <FaMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${selectBaseCls} ${value ? '' : 'text-slate-500'}`}
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
    </div>
  );
}

function DatePicker({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={filterSelectCls}>
      <FaCalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-[150px] bg-white border border-slate-300 rounded-md pl-7 pr-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
        aria-label={placeholder}
      />
    </div>
  );
}

function RowMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        aria-label="Row actions"
      >
        <FaEllipsisVertical className="text-sm" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs">
            <button
              onClick={() => setOpen(false)}
              className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition"
            >
              View details
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition"
            >
              View recipients
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const STATUS_OPTIONS = ['Processing', 'Complete', 'Paused', 'Cancelled', 'Queued'];

const STATUS_STYLES: Record<string, string> = {
  Complete: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Processing: 'bg-blue-50 border-blue-200 text-blue-700',
  Paused: 'bg-amber-50 border-amber-200 text-amber-700',
  Cancelled: 'bg-red-50 border-red-200 text-red-700',
  Queued: 'bg-slate-50 border-slate-200 text-slate-600',
};

const ACTION_OPTIONS = [
  'Campaign',
  'Delete',
  'Contacts to company',
  'Email',
  'Email verification',
  'Export',
  'Import',
  'Merge contacts',
  'Opportunity',
  'Review request',
  'SMS',
  'Add tag',
  'Remove tag',
  'whatsapp',
  'workflow',
];

function BulkActionsPage() {
  const actions = useBulkActions();
  const { staff } = useStaff();

  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const allRows = useMemo(() => actions.map(toRow), [actions]);

  const userOptions = useMemo(() => {
    const names = new Set<string>();
    staff.forEach((s) => {
      if (s.full_name) names.add(s.full_name);
    });
    allRows.forEach((r) => {
      if (r.user) names.add(r.user);
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [staff, allRows]);

  const rows = useMemo(() => {
    const startMs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
    const endMs = endDate ? new Date(`${endDate}T23:59:59`).getTime() : null;
    return allRows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (actionFilter && row.operation !== actionFilter) return false;
      if (userFilter && row.user !== userFilter) return false;
      if (startMs !== null && row.createdAtMs < startMs) return false;
      if (endMs !== null && row.createdAtMs > endMs) return false;
      return true;
    });
  }, [allRows, statusFilter, actionFilter, userFilter, startDate, endDate]);

  return (
    <div className="flex-1 overflow-auto bg-slate-100">
      <div className="p-4 md:p-6 space-y-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-800">Bulk actions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track progress and results for bulk actions.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 flex-shrink-0">Filters</span>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 flex-1">
              <DatePicker placeholder="Start date" value={startDate} onChange={setStartDate} />
              <DatePicker placeholder="End date" value={endDate} onChange={setEndDate} />
              <FilterSelect
                placeholder="All statuses"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              <FilterSelect
                placeholder="All actions"
                options={ACTION_OPTIONS}
                value={actionFilter}
                onChange={setActionFilter}
              />
              <FilterSelect
                placeholder="All users"
                options={userOptions}
                value={userFilter}
                onChange={setUserFilter}
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-horizontal-scrollbar">
            <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Action label</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Created (PKT)</th>
                  <th className="py-3 px-4">Completed (PKT)</th>
                  <th className="py-3 px-4 text-center">Statistics</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      {actions.length === 0
                        ? 'No bulk actions performed yet.'
                        : 'No actions match the selected filters.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 max-w-[220px]">
                      <span className="block truncate" title={row.label}>
                        {row.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.operation}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[10px] font-semibold whitespace-nowrap ${STATUS_STYLES[row.status] ?? STATUS_STYLES.Complete}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {row.userInitials}
                        </span>
                        <span className="text-slate-600 whitespace-nowrap">{row.user}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{row.created}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{row.completed}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-flex items-center justify-center text-slate-400"
                        title="View statistics"
                      >
                        {row.stats === 'chart' ? (
                          <FaChartBar className="text-sm" />
                        ) : (
                          <FaDownload className="text-sm" />
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RowMenu />
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="px-4 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
            <div className="font-medium">Page 1</div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">{rows.length} result{rows.length === 1 ? '' : 's'}</span>
              <button
                disabled
                className="px-2.5 py-1 border border-slate-200 rounded text-slate-400 bg-slate-50 text-xs font-medium cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled
                className="px-2.5 py-1 border border-slate-200 rounded text-slate-400 bg-slate-50 text-xs font-medium cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default BulkActionsPage;
