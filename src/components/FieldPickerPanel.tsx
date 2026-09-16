import { useMemo } from 'react';
import { FaCheck, FaChevronDown, FaChevronRight, FaMagnifyingGlass, FaSliders } from 'react-icons/fa6';
import type { FilterGroup } from '../data/smartListOptions';

function OptionRow({
  label,
  checked,
  onToggle,
  onOpenProperties,
  selectable = true,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onOpenProperties?: () => void;
  selectable?: boolean;
}) {
  if (!selectable) {
    return (
      <button
        onClick={onOpenProperties}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 rounded transition"
        title={`Configure ${label}`}
      >
        <span className="text-xs text-slate-700 truncate flex-1">{label}</span>
        <span className="text-slate-300 flex-shrink-0 transition">
          <FaChevronRight className="text-[10px]" />
        </span>
      </button>
    );
  }
  const showProperties = !!onOpenProperties;
  return (
    <div className="w-full flex items-center gap-2 px-3 py-1.5 group/option text-left hover:bg-slate-50 rounded transition">
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        className={`w-4 h-4 rounded-[5px] border flex items-center justify-center flex-shrink-0 cursor-pointer transition ${
          checked ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-slate-300'
        }`}
      >
        {checked && <FaCheck className="text-[8px] text-white" />}
      </span>
      <button
        onClick={showProperties ? onOpenProperties : onToggle}
        className="flex-1 min-w-0 flex items-center gap-2 text-left"
      >
        <span className="text-xs text-slate-700 truncate flex-1">{label}</span>
        {showProperties && (
          <span className="text-slate-300 group-hover/option:text-[#2563EB] flex-shrink-0 opacity-0 group-hover/option:opacity-100 transition">
            <FaSliders className="text-[9px]" />
          </span>
        )}
      </button>
    </div>
  );
}

function GroupSection({
  group,
  selected,
  onToggle,
  collapsed,
  onToggleCollapsed,
  onOpenProperties,
  selectable = true,
}: {
  group: FilterGroup;
  selected: Set<string>;
  onToggle: (opt: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenProperties?: (opt: string) => void;
  selectable?: boolean;
}) {
  const count = group.options.filter((o) => selected.has(o)).length;
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={onToggleCollapsed}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition"
      >
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          {collapsed ? (
            <FaChevronRight className="text-[9px] text-slate-400" />
          ) : (
            <FaChevronDown className="text-[9px] text-slate-400" />
          )}
          {group.label}
        </span>
        {count > 0 && (
          <span className="bg-[#2563EB1A] text-[#2563EB] text-[10px] font-bold rounded-full px-1.5 py-0.5">
            {count}
          </span>
        )}
      </button>
      {!collapsed && (
        <div className="pb-1.5">
          {group.options.map((opt) => (
            <OptionRow
              key={opt}
              label={opt}
              checked={selected.has(opt)}
              onToggle={() => onToggle(opt)}
              onOpenProperties={onOpenProperties ? () => onOpenProperties(opt) : undefined}
              selectable={selectable}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function GroupedMultiPanel({
  groups,
  selected,
  onToggle,
  onClear,
  collapsedState,
  onToggleCollapsed,
  search,
  onSearchChange,
  onOpenProperties,
  selectable = true,
  className = 'max-h-[340px]',
}: {
  groups: FilterGroup[];
  selected: Set<string>;
  onToggle: (opt: string) => void;
  onClear: () => void;
  collapsedState: Record<string, boolean>;
  onToggleCollapsed: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onOpenProperties?: (opt: string) => void;
  selectable?: boolean;
  className?: string;
}) {
  const q = search.trim().toLowerCase();
  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, options: g.options.filter((o) => o.toLowerCase().includes(q)) }))
        .filter((g) => g.options.length > 0),
    [groups, q]
  );

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-2 border-b border-slate-100 flex-shrink-0">
        <div className="relative flex items-center">
          <FaMagnifyingGlass className="absolute left-3 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400"
          />
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        {visibleGroups.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No matching options</p>
        ) : (
          visibleGroups.map((g) => (
            <GroupSection
              key={g.id}
              group={g}
              selected={selected}
              onToggle={onToggle}
              collapsed={!!collapsedState[g.id]}
              onToggleCollapsed={() => onToggleCollapsed(g.id)}
              onOpenProperties={onOpenProperties}
              selectable={selectable}
            />
          ))
        )}
      </div>
      {selectable && (
        <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] flex-shrink-0 bg-slate-50/50">
          <span className="text-slate-500 font-medium">{selected.size} selected</span>
          <button onClick={onClear} className="text-red-500 hover:text-red-600 font-semibold">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export function GroupedSinglePanel({
  options,
  value,
  onSelect,
  search,
  onSearchChange,
  className = 'max-h-[340px]',
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  className?: string;
}) {
  const q = search.trim().toLowerCase();
  const visible = useMemo(() => options.filter((o) => o.toLowerCase().includes(q)), [options, q]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-2 border-b border-slate-100 flex-shrink-0">
        <div className="relative flex items-center">
          <FaMagnifyingGlass className="absolute left-3 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400"
          />
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        {visible.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No matching options</p>
        ) : (
          visible.map((opt) => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 rounded transition ${
                value === opt ? 'bg-[#2563EB0D]' : ''
              }`}
            >
              <span className={`text-xs truncate ${value === opt ? 'text-[#2563EB] font-semibold' : 'text-slate-700'}`}>
                {opt}
              </span>
              {value === opt && <FaCheck className="text-[10px] text-[#2563EB] flex-shrink-0" />}
            </button>
          ))
        )}
      </div>
      <div className="px-3 py-2 border-t border-slate-100 text-[11px] text-slate-500 flex-shrink-0 bg-slate-50/50 font-medium">
        {value ? `Sort by: ${value}` : 'No sort selected'}
      </div>
    </div>
  );
}
