import { useEffect, useMemo, useState } from 'react';
import {
  FaBullhorn,
  FaCircleInfo,
  FaFilter,
  FaMagnifyingGlass,
  FaXmark,
} from 'react-icons/fa6';
import { api, type DealerDashboardDealer, type DealerLeadFilter } from '../../api';
import { formatDbDate } from '../../utils';

function AssignLeadsModal({
  dealers,
  onClose,
  onNotify,
  onDone,
}: {
  dealers: DealerDashboardDealer[];
  onClose: () => void;
  onNotify: (msg: string) => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<'select' | 'filter'>('select');
  const [dealerId, setDealerId] = useState<number>(dealers[0]?.dealer_id ?? 0);
  const [unassigned, setUnassigned] = useState<{ id: number; name: string; phone: string | null; email: string | null; created_at: string | null }[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [periodValue, setPeriodValue] = useState(1);
  const [periodUnit, setPeriodUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('days');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'period' | 'range'>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .dealerUnassignedLeads()
      .then((res) => {
        if (!active) return;
        setUnassigned(res.data.map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, created_at: c.created_at })));
      })
      .catch((err) => {
        if (active) onNotify(`Failed to load unassigned leads: ${(err as Error).message}`);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [onNotify]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unassigned;
    return unassigned.filter((l) =>
      [l.name, l.phone, l.email].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [unassigned, search]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const ids = filtered.map((l) => l.id);
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const buildFilter = (): DealerLeadFilter | undefined => {
    if (mode === 'select') return undefined;
    if (filterType === 'period') return { type: periodUnit, value: periodValue };
    if (filterType === 'range') return { type: 'range', from: fromDate || undefined, to: toDate || undefined };
    return { type: 'all' };
  };

  const submit = async () => {
    if (dealerId <= 0) {
      onNotify('Please select a dealer first');
      return;
    }
    const filter = buildFilter();
    const contactIds = mode === 'select' ? [...selected] : undefined;
    if (mode === 'select' && contactIds && contactIds.length === 0) {
      onNotify('Select at least one lead to assign');
      return;
    }
    if (mode === 'filter' && filterType === 'range' && (!fromDate || !toDate)) {
      onNotify('Pick a from and to date for the range filter');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.assignLeadsToDealer({ dealer_id: dealerId, contact_ids: contactIds, filter });
      onNotify(res.message);
      onDone();
    } catch (err) {
      onNotify(`Assign failed: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const matchingCount = useMemo(() => {
    if (mode === 'select') return selected.size;
    if (filterType === 'range') {
      const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
      const to = toDate ? new Date(toDate).getTime() + 86400000 : Infinity;
      return unassigned.filter((l) => {
        if (!l.created_at) return false;
        const t = new Date(l.created_at.replace(' ', 'T')).getTime();
        return t >= from && t <= to;
      }).length;
    }
    if (filterType === 'period') {
      const cutoff = Date.now() - periodValue * (periodUnit === 'days' ? 86400000 : periodUnit === 'weeks' ? 7 * 86400000 : periodUnit === 'months' ? 30 * 86400000 : 365 * 86400000);
      return unassigned.filter((l) => {
        if (!l.created_at) return false;
        return new Date(l.created_at.replace(' ', 'T')).getTime() >= cutoff;
      }).length;
    }
    return unassigned.length;
  }, [mode, selected, filterType, periodValue, periodUnit, fromDate, toDate, unassigned]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FaBullhorn className="text-blue-600" /> Assign Leads to Dealer
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            <FaXmark />
          </button>
        </div>

        <div className="mb-4 shrink-0">
          <div className="text-[11px] font-semibold text-slate-600 mb-1">Assign to dealer / franchise</div>
          {dealers.length === 0 ? (
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2.5">
              No dealers exist yet. Create staff users with the Dealer role first.
            </p>
          ) : (
            <select
              value={dealerId}
              onChange={(e) => setDealerId(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              {dealers.map((d) => (
                <option key={d.dealer_id} value={d.dealer_id}>
                  {d.full_name} {d.email ? `(${d.email})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4 shrink-0">
          <button
            onClick={() => setMode('select')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              mode === 'select' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Select leads
          </button>
          <button
            onClick={() => setMode('filter')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              mode === 'filter' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FaFilter className="inline mr-1 text-[10px]" />
            Assign by date filter
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[180px]">
          {mode === 'select' ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <FaMagnifyingGlass className="absolute left-2.5 top-2 text-slate-400 text-[11px]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search unassigned leads..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-md py-1.5 pl-7 pr-3 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={toggleAll}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold whitespace-nowrap"
                >
                  {filtered.length > 0 && filtered.every((l) => selected.has(l.id)) ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading leads...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <FaCircleInfo className="text-2xl text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 text-xs mb-1">No unassigned leads</p>
                  <p className="text-[11px] text-slate-400">Every lead is already assigned to a dealer.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-md divide-y divide-slate-100">
                  {filtered.map((lead) => (
                    <label
                      key={lead.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggle(lead.id)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-xs truncate">{lead.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {[lead.phone, lead.email].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {lead.created_at ? formatDbDate(lead.created_at) : ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-slate-600 mb-2">What to assign</div>
                <div className="flex items-center gap-2">
                  {(['all', 'period', 'range'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-1.5 rounded-md border text-[11px] font-medium transition ${
                        filterType === t
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {t === 'all' ? 'All unassigned' : t === 'period' ? 'Previous period' : 'Date range'}
                    </button>
                  ))}
                </div>
              </div>

              {filterType === 'period' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={periodValue}
                    onChange={(e) => setPeriodValue(Math.max(1, Number(e.target.value)))}
                    className="w-24 bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={periodUnit}
                    onChange={(e) => setPeriodUnit(e.target.value as 'days' | 'weeks' | 'months' | 'years')}
                    className="bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="days">Day(s)</option>
                    <option value="weeks">Week(s)</option>
                    <option value="months">Month(s)</option>
                    <option value="years">Year(s)</option>
                  </select>
                  <span className="text-[11px] text-slate-500">leads created in the last {periodValue} {periodUnit}</span>
                </div>
              )}

              {filterType === 'range' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">From</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">To</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-2.5">
                This will assign <strong>{matchingCount}</strong> lead(s) matching the filter to the selected dealer.
                Only leads not already assigned to a dealer are included.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={submitting || dealers.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-sm transition"
          >
            {submitting ? 'Assigning...' : `Assign ${mode === 'select' ? selected.size : matchingCount} lead(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignLeadsModal;