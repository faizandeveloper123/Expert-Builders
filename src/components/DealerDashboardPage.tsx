import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBullhorn,
  FaCheck,
  FaCircleInfo,
  FaCircleXmark,
  FaClock,
  FaEnvelope,
  FaFilter,
  FaGaugeHigh,
  FaMagnifyingGlass,
  FaMessage,
  FaPenNib,
  FaPhone,
  FaPlus,
  FaRotate,
  FaRocket,
  FaShareNodes,
  FaTrophy,
  FaUserGear,
  FaWhatsapp,
  FaXmark,
} from 'react-icons/fa6';
import { api, type DealerDashboardDealer, type DealerLead, type DealerLeadFilter, type DealerLeadStatus } from '../api';
import { useAuth } from '../auth';
import { formatDbDate } from '../utils';

const OWNER_EMAIL = 'yadeapakistan@gmail.com';

const STATUS_META: Record<DealerLeadStatus, { label: string; className: string; dot: string; hint: string }> = {
  non_contacted: { label: 'Non-Contacted', className: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', hint: 'Not contacted yet' },
  contacted: { label: 'Contacted', className: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', hint: 'Called / emailed / messaged' },
  closed: { label: 'Closed', className: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', hint: 'Gave a date, will talk later' },
  customer: { label: 'Customer', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', hint: 'Bought the bike' },
  rejected: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', hint: 'Refused to buy' },
};

const STAGE_ORDER: DealerLeadStatus[] = ['non_contacted', 'contacted', 'closed', 'customer', 'rejected'];

const CHANNELS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'email', label: 'Email', icon: <FaEnvelope /> },
  { key: 'sms', label: 'SMS', icon: <FaMessage /> },
  { key: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp /> },
  { key: 'call', label: 'Call', icon: <FaPhone /> },
];

function StatusBadge({ status }: { status: DealerLeadStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.non_contacted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[11px] font-medium ${meta.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-slate-800 leading-none">{value}</div>
        <div className="text-[11px] text-slate-500 mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

function DealerDashboardPage({ onNotify }: { onNotify: (msg: string) => void }) {
  const { user } = useAuth();
  const isOwner = user?.user_type === 'Admin' || user?.email?.toLowerCase() === OWNER_EMAIL;
  // A Follower views their managing Dealer's dashboard so both see the same leads.
  const dealerId = user?.user_type === 'Follower' && user.manager_id != null ? user.manager_id : user?.id ?? 0;

  return isOwner ? (
    <OwnerDashboard onNotify={onNotify} />
  ) : (
    <DealerView dealerId={dealerId} onNotify={onNotify} />
  );
}

/* ============================ OWNER VIEW ============================ */

function OwnerDashboard({ onNotify }: { onNotify: (msg: string) => void }) {
  const [summary, setSummary] = useState<{ dealers: DealerDashboardDealer[]; unassigned: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDealer, setSelectedDealer] = useState<DealerDashboardDealer | null>(null);
  const [dealerLeads, setDealerLeads] = useState<DealerLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.dealerDashboardSummary();
      setSummary(res.data);
    } catch (err) {
      onNotify(`Failed to load dashboard: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const openDealer = async (dealer: DealerDashboardDealer) => {
    setSelectedDealer(dealer);
    await loadDealerLeads(dealer.dealer_id, '');
  };

  const loadDealerLeads = async (dealerId: number, status: string) => {
    setLeadsLoading(true);
    try {
      const res = await api.dealerLeads(dealerId, status ? (status as DealerLeadStatus) : undefined);
      setDealerLeads(res.data);
    } catch (err) {
      onNotify(`Failed to load leads: ${(err as Error).message}`);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleDealerStatusFilter = (status: string) => {
    setStatusFilter(status);
    if (selectedDealer) void loadDealerLeads(selectedDealer.dealer_id, status);
  };

  const totalAssigned = summary?.dealers.reduce((sum, d) => sum + d.total, 0) ?? 0;
  const totalCustomer = summary?.dealers.reduce((sum, d) => sum + d.customer, 0) ?? 0;
  const totalClosed = summary?.dealers.reduce((sum, d) => sum + d.closed, 0) ?? 0;
  const totalRejected = summary?.dealers.reduce((sum, d) => sum + d.rejected, 0) ?? 0;
  const totalContacted = summary?.dealers.reduce((sum, d) => sum + d.contacted, 0) ?? 0;
  const totalNonContacted = summary?.dealers.reduce((sum, d) => sum + d.non_contacted, 0) ?? 0;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <FaGaugeHigh className="text-sm" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">Owner Dashboard</h1>
            <p className="text-xs text-slate-500">Track every franchise & dealer across Pakistan</p>
          </div>
        </div>
        <button
          onClick={() => setAssignOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-3.5 py-2 rounded-md text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <FaPlus className="text-xs" /> Assign Leads
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<FaUserGear />} label="Dealers / Franchises" value={summary?.dealers.length ?? 0} accent="bg-blue-100 text-blue-600" />
          <StatCard icon={<FaRocket />} label="Total Leads Assigned" value={totalAssigned} accent="bg-indigo-100 text-indigo-600" />
          <StatCard icon={<FaClock />} label="Not Yet Contacted" value={totalNonContacted} accent="bg-slate-100 text-slate-600" />
          <StatCard icon={<FaCircleXmark />} label="Unassigned Leads" value={summary?.unassigned ?? 0} accent="bg-amber-100 text-amber-600" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<FaMessage />} label="Contacted" value={totalContacted} accent="bg-blue-100 text-blue-600" />
          <StatCard icon={<FaClock />} label="Closed (talk later)" value={totalClosed} accent="bg-amber-100 text-amber-600" />
          <StatCard icon={<FaCircleXmark />} label="Rejected" value={totalRejected} accent="bg-rose-100 text-rose-600" />
          <StatCard icon={<FaTrophy />} label="Customers (bought)" value={totalCustomer} accent="bg-emerald-100 text-emerald-600" />
        </div>

        {/* Dealers table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-xs text-slate-700">Dealers & Franchises</h2>
            <button
              onClick={() => void loadSummary()}
              className="text-slate-400 hover:text-slate-600 p-1 text-xs"
              title="Refresh"
            >
              <FaRotate />
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-slate-500">Loading dealer data...</div>
          ) : summary && summary.dealers.length === 0 ? (
            <div className="p-10 text-center">
              <FaUserGear className="text-2xl text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600 text-xs mb-1">No dealers yet</p>
              <p className="text-[11px] text-slate-400">Create staff users with the Dealer role to start assigning leads.</p>
            </div>
          ) : summary && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-medium text-[11px]">
                    <th className="py-2.5 px-4">Dealer</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3 text-center">Non-Contacted</th>
                    <th className="py-2.5 px-3 text-center">Contacted</th>
                    <th className="py-2.5 px-3 text-center">Closed</th>
                    <th className="py-2.5 px-3 text-center">Customer</th>
                    <th className="py-2.5 px-3 text-center">Rejected</th>
                    <th className="py-2.5 px-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.dealers.map((d) => (
                    <tr key={d.dealer_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                            {d.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{d.full_name}</div>
                            <div className="text-[10px] text-slate-400">{d.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{d.total}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{d.non_contacted}</td>
                      <td className="py-3 px-3 text-center text-blue-600">{d.contacted}</td>
                      <td className="py-3 px-3 text-center text-amber-600">{d.closed}</td>
                      <td className="py-3 px-3 text-center text-emerald-600">{d.customer}</td>
                      <td className="py-3 px-3 text-center text-rose-600">{d.rejected}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => void openDealer(d)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] hover:underline"
                        >
                          View leads
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected dealer leads */}
        {selectedDealer && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDealer(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-xs"
                  title="Back to dealers"
                >
                  <FaArrowLeft />
                </button>
                <div>
                  <h2 className="font-semibold text-xs text-slate-700">
                    {selectedDealer.full_name}'s Leads
                    <span className="text-slate-400 font-normal ml-1.5">({dealerLeads.length})</span>
                  </h2>
                  <p className="text-[10px] text-slate-400">Every assigned lead and its tracking status</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['', ...STAGE_ORDER] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleDealerStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-full border text-[10px] font-medium transition ${
                      statusFilter === s
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {s === '' ? 'All' : STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>

            {leadsLoading ? (
              <div className="p-10 text-center text-xs text-slate-500">Loading leads...</div>
            ) : dealerLeads.length === 0 ? (
              <div className="p-10 text-center">
                <FaBullhorn className="text-2xl text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 text-xs mb-1">No leads found</p>
                <p className="text-[11px] text-slate-400">No leads match this status for this dealer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-medium text-[11px]">
                      <th className="py-2.5 px-4">Lead</th>
                      <th className="py-2.5 px-3">Assigned On</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Response Channel</th>
                      <th className="py-2.5 px-3">Response / Note</th>
                      <th className="py-2.5 px-3">Last Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dealerLeads.map((lead) => (
                      <tr key={lead.contact_id} className="hover:bg-slate-50/80 transition align-top">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{lead.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {[lead.phone, lead.email].filter(Boolean).join(' · ') || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {lead.created_at ? formatDbDate(lead.created_at) : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {lead.response_channel ? (
                            <span className="capitalize">{lead.response_channel}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[220px]">
                          {lead.response_note || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {lead.updated_at ? formatDbDate(lead.updated_at) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {assignOpen && (
        <AssignLeadsModal
          dealers={summary?.dealers ?? []}
          onClose={() => setAssignOpen(false)}
          onNotify={onNotify}
          onDone={() => {
            setAssignOpen(false);
            void loadSummary();
          }}
        />
      )}
    </div>
  );
}

/* ============================ ASSIGN LEADS MODAL ============================ */

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

  // Filter state
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

        {/* Dealer picker */}
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

        {/* Mode tabs */}
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

/* ============================ DEALER / USER VIEW ============================ */

function DealerView({ dealerId, onNotify }: { dealerId: number; onNotify: (msg: string) => void }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<DealerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'' | DealerLeadStatus>('');
  const [updateLead, setUpdateLead] = useState<DealerLead | null>(null);
  const [tagColors, setTagColors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.dealerLeads(dealerId);
      setLeads(res.data);
    } catch (err) {
      onNotify(`Failed to load your leads: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [dealerId, onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    api
      .listTags()
      .then((res) => {
        if (!active) return;
        const map: Record<string, string> = {};
        for (const t of res.data) map[t.name] = t.color;
        setTagColors(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const total = leads.length;
    const byStatus = leads.reduce<Record<DealerLeadStatus, number>>(
      (acc, l) => {
        acc[l.status] = (acc[l.status] ?? 0) + 1;
        return acc;
      },
      { non_contacted: 0, contacted: 0, closed: 0, customer: 0, rejected: 0 }
    );
    return { total, byStatus };
  }, [leads]);

  const visible = useMemo(
    () => (filter === '' ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter]
  );

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === visible.length && visible.length > 0 ? new Set() : new Set(visible.map((l) => l.contact_id))
    );
  };

  const clearSelection = () => setSelected(new Set());

  const handleBucket = async (status: '' | DealerLeadStatus) => {
    if (status !== '' && selected.size > 0) {
      setMoving(true);
      try {
        const res = await api.bulkUpdateDealerLeadStatus({
          dealer_id: dealerId,
          contact_ids: [...selected],
          status,
        });
        onNotify(res.message || 'Leads moved');
        setSelected(new Set());
        setFilter(status);
        await load();
      } catch (err) {
        onNotify(`Update failed: ${(err as Error).message}`);
      } finally {
        setMoving(false);
      }
    } else {
      setFilter(status);
    }
  };

  const handleSave = async (lead: DealerLead, status: DealerLeadStatus, channel: string, note: string) => {
    try {
      await api.updateDealerLeadStatus(lead.contact_id, {
        dealer_id: dealerId,
        status,
        response_channel: channel,
        response_note: note || null,
      });
      onNotify('Lead updated — the owner can now see it');
      setUpdateLead(null);
      await load();
    } catch (err) {
      onNotify(`Update failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <FaGaugeHigh className="text-sm" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">My Dealer Dashboard</h1>
            <p className="text-xs text-slate-500">
              {user?.full_name ?? 'Dealer'} — {counts.total} lead(s) assigned
            </p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="text-slate-400 hover:text-slate-600 p-1.5 text-xs"
          title="Refresh"
        >
          <FaRotate />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Bucket buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void handleBucket('')}
            title="Show all leads"
            className={`flex items-center gap-1.5 border rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${
              filter === ''
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <FaRocket className="text-[10px]" /> Total
            <span className="font-bold">{counts.total}</span>
          </button>
          {STAGE_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => void handleBucket(s)}
              disabled={moving}
              title={STATUS_META[s].hint}
              className={`flex items-center gap-1.5 border rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${
                filter === s
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}
              <span className="font-bold">{counts.byStatus[s] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Selection toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.size === visible.length && visible.length > 0}
              onChange={toggleAll}
              className="accent-blue-600 w-3.5 h-3.5"
            />
            Select all ({visible.length})
          </label>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-semibold text-blue-700">{selected.size} selected</span>
              <span className="text-slate-400">— pick a bucket button above to move them</span>
              <button
                onClick={clearSelection}
                className="text-slate-400 hover:text-slate-600 font-medium underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Leads list */}
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">Loading your leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-10 text-center bg-white border border-slate-200 rounded-lg shadow-xs">
            <FaRocket className="text-2xl text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600 text-xs mb-1">No leads assigned yet</p>
            <p className="text-[11px] text-slate-400">Your assigned leads will appear here once the owner assigns them.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center bg-white border border-slate-200 rounded-lg shadow-xs">
            <p className="font-semibold text-slate-600 text-xs mb-1">No leads in this bucket</p>
            <p className="text-[11px] text-slate-400">Check some leads and click this bucket's button to move them here.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs divide-y divide-slate-100 overflow-hidden">
            {visible.map((lead) => (
              <div
                key={lead.contact_id}
                className={`flex items-center gap-3 px-3 sm:px-4 py-3 transition ${
                  selected.has(lead.contact_id) ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(lead.contact_id)}
                  onChange={() => toggleSelect(lead.contact_id)}
                  className="accent-blue-600 w-4 h-4 shrink-0"
                />

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {lead.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-xs truncate">{lead.name}</span>
                    {lead.tags?.map((t) => (
                      <span
                        key={t}
                        className={`px-2 py-0.5 rounded-full text-[10px] border border-slate-200 whitespace-nowrap ${
                          tagColors[t] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {[lead.phone, lead.email, lead.business_name].filter(Boolean).join(' · ') || '—'}
                    {lead.created_at ? `  ·  ${formatDbDate(lead.created_at)}` : ''}
                  </div>
                  {lead.response_note && (
                    <div className="text-[10px] text-slate-500 mt-1 bg-slate-50 border border-slate-100 rounded px-2 py-1 line-clamp-1">
                      {lead.response_note}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={lead.status} />
                  <button
                    onClick={() => setUpdateLead(lead)}
                    className="text-slate-400 hover:text-blue-600 text-xs p-1.5"
                    title="Channel & note"
                  >
                    <FaPenNib />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {updateLead && (
        <UpdateLeadModal
          lead={updateLead}
          onClose={() => setUpdateLead(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ============================ UPDATE LEAD STATUS MODAL ============================ */

function UpdateLeadModal({
  lead,
  onClose,
  onSave,
}: {
  lead: DealerLead;
  onClose: () => void;
  onSave: (lead: DealerLead, status: DealerLeadStatus, channel: string, note: string) => void;
}) {
  const [status, setStatus] = useState<DealerLeadStatus>(lead.status);
  const [channel, setChannel] = useState(lead.response_channel);
  const [note, setNote] = useState(lead.response_note ?? '');
  const [saving, setSaving] = useState(false);

  const doSave = () => {
    setSaving(true);
    onSave(lead, status, channel, note);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FaShareNodes className="text-blue-600" /> Update Lead Status
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            <FaXmark />
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <div className="font-semibold text-slate-800">{lead.name}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {[lead.phone, lead.email].filter(Boolean).join(' · ') || '—'}
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="font-semibold text-slate-700 mb-1">Lead stage</div>
            <div className="text-[10px] text-slate-400 mb-2">Which stage is this lead at right now?</div>
            <div className="space-y-1.5">
              {STAGE_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`w-full px-3 py-2 rounded-md border text-[11px] font-medium transition flex items-center justify-between gap-2 ${
                    status === s
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_META[s].dot}`} />
                    <span className="font-semibold">{STATUS_META[s].label}</span>
                    <span className="text-[10px] text-slate-400 truncate">{STATUS_META[s].hint}</span>
                  </span>
                  {status === s && <FaCheck className="text-blue-600 text-[10px] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Response channel */}
          <div>
            <div className="font-semibold text-slate-700 mb-2">Response channel (if any)</div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setChannel('')}
                className={`px-2 py-2 rounded-md border text-[11px] font-medium transition ${
                  channel === '' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                None
              </button>
              {CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => setChannel(ch.key)}
                  className={`px-2 py-2 rounded-md border text-[11px] font-medium flex flex-col items-center gap-1 transition ${
                    channel === ch.key
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                  }`}
                >
                  <span className="text-xs">{ch.icon}</span>
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <div className="font-semibold text-slate-700 mb-1">Detailed note (visible to owner)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Lead called back, interested in E6 Sport, asked for price + finance options..."
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={doSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-sm transition"
          >
            {saving ? 'Saving...' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DealerDashboardPage;