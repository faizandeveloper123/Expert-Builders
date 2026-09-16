import { useEffect, useRef, useState } from 'react';
import {
  FaArrowsUpDown,
  FaBarsStaggered,
  FaChevronDown,
  FaListOl,
  FaSliders,
  FaUserGear,
  FaXmark,
} from 'react-icons/fa6';
import { FILTER_GROUPS, SORT_OPTIONS } from '../data/smartListOptions';
import { TABLE_FILTER_GROUPS } from '../data/tableFields';
import { GroupedMultiPanel, GroupedSinglePanel } from './FieldPickerPanel';
import { api, type ApiStaffUser } from '../api';
import AnchoredPopover from './AnchoredPopover';

export interface SmartList {
  id: string;
  name: string;
  filters: string[];
  sortBy: string;
  fields: string[];
  members: number[];
  /** Optional dealer the whole smart list is assigned to. */
  dealerId?: number | null;
  dealerName?: string | null;
}

interface SmartListDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (list: Omit<SmartList, 'id' | 'members'>) => void;
}

type DropdownId = 'filters' | 'sort' | 'fields' | 'dealer';

const inputCls =
  'w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-[0_0_0_2px_rgba(37,99,235,0.2)] transition';

function SmartListDrawer({ open, onClose, onSave }: SmartListDrawerProps) {
  const [name, setName] = useState('');
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('');
  const [fields, setFields] = useState<Set<string>>(new Set());
  const [dealerId, setDealerId] = useState<number>(0);
  const [dealers, setDealers] = useState<ApiStaffUser[]>([]);
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState<Record<DropdownId, string>>({ filters: '', sort: '', fields: '', dealer: '' });
  const filtersBtnRef = useRef<HTMLButtonElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const fieldsBtnRef = useRef<HTMLButtonElement>(null);
  const dealerBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    api
      .listStaff()
      .then((res) => {
        if (!active) return;
        setDealers(res.data.filter((s) => s.user_type === 'Dealer'));
      })
      .catch(() => {
        /* ignore - dealer assignment stays optional */
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const toggleDropdown = (id: DropdownId) => setOpenDropdown((prev) => (prev === id ? null : id));
  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleFilter = (opt: string) =>
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });

  const toggleField = (opt: string) =>
    setFields((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });

  const save = () => {
    if (!name.trim()) return;
    const dealer = dealers.find((d) => d.id === dealerId);
    onSave({
      name: name.trim(),
      filters: [...filters],
      sortBy,
      fields: [...fields],
      dealerId: dealer ? dealer.id : null,
      dealerName: dealer ? dealer.full_name : null,
    });
  };

  const count = filters.size + (sortBy ? 1 : 0) + fields.size;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-[420px] max-w-[94vw] h-full bg-[#F8FAFC] shadow-2xl flex flex-col animate-[eveeSlideLeft_0.3s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="px-4 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2563EB1A] border border-[#93C5FD] flex items-center justify-center text-[#2563EB]">
              <FaBarsStaggered className="text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E293B] text-sm">New Smart List</h3>
              <p className="text-[10px] text-[#64748B]">Create a list of contacts using filters</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] transition">
            <FaXmark className="text-sm" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#1E293B] mb-1.5">
              Smart list name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hot Flooring Leads"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1E293B] mb-1.5">Filters</label>
            <div className="relative">
              <button
                ref={filtersBtnRef}
                onClick={() => toggleDropdown('filters')}
                className="w-full flex items-center justify-between border border-[#E2E8F0] rounded-lg px-3 py-2.5 bg-white hover:border-[#93C5FD] text-xs transition"
              >
                <span className="flex items-center gap-2 text-[#1E293B] font-medium">
                  <FaSliders className="text-[#64748B] text-[11px]" />
                  Filters
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  {filters.size > 0 && (
                    <span className="bg-[#2563EB1A] text-[#2563EB] rounded-full px-1.5 text-[10px] font-bold">
                      {filters.size}
                    </span>
                  )}
                  <FaChevronDown
                    className={`text-[10px] transition-transform ${openDropdown === 'filters' ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              <AnchoredPopover
                open={openDropdown === 'filters'}
                anchorEl={filtersBtnRef.current}
                onClose={() => setOpenDropdown(null)}
                placement="bottom-start"
                matchAnchorWidth
                offset={8}
                zIndex={100}
                className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden"
              >
                <GroupedMultiPanel
                  groups={FILTER_GROUPS}
                  selected={filters}
                  onToggle={toggleFilter}
                  onClear={() => setFilters(new Set())}
                  collapsedState={collapsed}
                  onToggleCollapsed={toggleCollapsed}
                  search={search.filters}
                  onSearchChange={(v) => setSearch((prev) => ({ ...prev, filters: v }))}
                />
              </AnchoredPopover>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1E293B] mb-1.5">Sort by</label>
            <div className="relative">
              <button
                ref={sortBtnRef}
                onClick={() => toggleDropdown('sort')}
                className="w-full flex items-center justify-between border border-[#E2E8F0] rounded-lg px-3 py-2.5 bg-white hover:border-[#93C5FD] text-xs transition"
              >
                <span className="flex items-center gap-2 text-[#1E293B] font-medium">
                  <FaArrowsUpDown className="text-[#64748B] text-[11px]" />
                  {sortBy ? <span className="truncate">{sortBy}</span> : 'Sort by'}
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <FaChevronDown
                    className={`text-[10px] transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              <AnchoredPopover
                open={openDropdown === 'sort'}
                anchorEl={sortBtnRef.current}
                onClose={() => setOpenDropdown(null)}
                placement="bottom-start"
                matchAnchorWidth
                offset={8}
                zIndex={100}
                className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden"
              >
                <GroupedSinglePanel
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onSelect={(v) => {
                    setSortBy(v);
                    setOpenDropdown(null);
                  }}
                  search={search.sort}
                  onSearchChange={(v) => setSearch((prev) => ({ ...prev, sort: v }))}
                />
              </AnchoredPopover>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1E293B] mb-1.5">Fields</label>
            <div className="relative">
              <button
                ref={fieldsBtnRef}
                onClick={() => toggleDropdown('fields')}
                className="w-full flex items-center justify-between border border-[#E2E8F0] rounded-lg px-3 py-2.5 bg-white hover:border-[#93C5FD] text-xs transition"
              >
                <span className="flex items-center gap-2 text-[#1E293B] font-medium">
                  <FaListOl className="text-[#64748B] text-[11px]" />
                  Fields
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  {fields.size > 0 && (
                    <span className="bg-[#2563EB1A] text-[#2563EB] rounded-full px-1.5 text-[10px] font-bold">
                      {fields.size}
                    </span>
                  )}
                  <FaChevronDown
                    className={`text-[10px] transition-transform ${openDropdown === 'fields' ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              <AnchoredPopover
                open={openDropdown === 'fields'}
                anchorEl={fieldsBtnRef.current}
                onClose={() => setOpenDropdown(null)}
                placement="bottom-start"
                matchAnchorWidth
                offset={8}
                zIndex={100}
                className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden"
              >
                <GroupedMultiPanel
                  groups={TABLE_FILTER_GROUPS}
                  selected={fields}
                  onToggle={toggleField}
                  onClear={() => setFields(new Set())}
                  collapsedState={collapsed}
                  onToggleCollapsed={toggleCollapsed}
                  search={search.fields}
                  onSearchChange={(v) => setSearch((prev) => ({ ...prev, fields: v }))}
                />
              </AnchoredPopover>
            </div>
          </div>

          <div className="pt-1 border-t border-[#E2E8F0]">
            <label className="block text-xs font-medium text-[#1E293B] mb-1.5">
              Assign to dealer <span className="font-normal text-[#64748B]">(optional)</span>
            </label>
            <p className="text-[10px] text-[#64748B] mb-2">
              Every lead in this smart list will be assigned to the selected dealer.
            </p>
            <div className="relative">
              <button
                ref={dealerBtnRef}
                onClick={() => toggleDropdown('dealer')}
                className="w-full flex items-center justify-between border border-[#E2E8F0] rounded-lg px-3 py-2.5 bg-white hover:border-[#93C5FD] text-xs transition"
              >
                <span className="flex items-center gap-2 text-[#1E293B] font-medium truncate">
                  <FaUserGear className="text-[#64748B] text-[11px] flex-shrink-0" />
                  {dealerId > 0
                    ? dealers.find((d) => d.id === dealerId)?.full_name ?? 'Select a dealer'
                    : 'Not assigned'}
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  {dealerId > 0 && (
                    <span className="bg-emerald-100 text-emerald-700 rounded-full px-1.5 text-[10px] font-bold">
                      Assigned
                    </span>
                  )}
                  <FaChevronDown
                    className={`text-[10px] transition-transform ${openDropdown === 'dealer' ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              <AnchoredPopover
                open={openDropdown === 'dealer'}
                anchorEl={dealerBtnRef.current}
                onClose={() => setOpenDropdown(null)}
                placement="bottom-start"
                matchAnchorWidth
                offset={8}
                zIndex={100}
                className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden"
              >
                <div className="max-h-64 overflow-y-auto p-1.5">
                  <button
                    onClick={() => {
                      setDealerId(0);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                      dealerId === 0 ? 'bg-[#2563EB0D] text-[#2563EB] font-semibold' : 'text-[#1E293B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    Not assigned
                  </button>
                  {dealers.length === 0 && (
                    <p className="px-3 py-2 text-xs text-[#64748B]">No dealers found.</p>
                  )}
                  {dealers.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDealerId(d.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                        dealerId === d.id
                          ? 'bg-[#2563EB0D] text-[#2563EB] font-semibold'
                          : 'text-[#1E293B] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {d.full_name}
                    </button>
                  ))}
                </div>
              </AnchoredPopover>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-white border-t border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-[#64748B]">
            {count > 0 ? `${count} rule${count === 1 ? '' : 's'} set` : 'No rules set'}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#1E293B] text-xs font-semibold rounded-md transition"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!name.trim()}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartListDrawer;
