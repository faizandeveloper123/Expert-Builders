import { useState } from 'react';
import { useEffect } from 'react';
import {
  FaArrowLeft,
  FaArrowsUpDown,
  FaChevronDown,
  FaFilter,
  FaPen,
  FaPlus,
  FaTrashCan,
  FaXmark,
} from 'react-icons/fa6';
import {
  FILTER_GROUPS,
  SORT_OPTIONS,
  filterConditions,
  getFilterProperties,
  type FilterProperty,
  type FilterRule,
  type NestedFilterRule,
} from '../data/smartListOptions';
import { GroupedMultiPanel, GroupedSinglePanel } from './FieldPickerPanel';
import { COUNTRIES } from '../data/countries';
import { timezones } from '../data/formOptions';
import { AGE_VALUE_OPTIONS, DATE_VALUE_OPTIONS } from '../data/filterConfigs';
import { useStaff } from '../StaffContext';
import { api } from '../api';

const ALL_FILTER_FIELDS = FILTER_GROUPS.flatMap((g) => g.options);

const AGE_UNITS = ['Years', 'Months', 'Weeks', 'Days'];
const DATE_UNITS = ['Days', 'Months', 'Years'];

interface DrawerShellProps {
  title: string;
  sub?: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

function DrawerShell({ title, sub, icon, onClose, children, footer }: DrawerShellProps) {
  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-[400px] max-w-[92vw] h-full bg-[#F8FAFC] shadow-2xl flex flex-col animate-[eveeSlideLeft_0.3s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="px-4 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2563EB1A] border border-[#93C5FD] flex items-center justify-center text-[#2563EB]">
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-[#1E293B] text-sm">{title}</h3>
              {sub && <p className="text-[10px] text-[#64748B]">{sub}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] transition">
            <FaXmark className="text-sm" />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}

export function TableFilterDrawer({
  open,
  initialRules,
  onClose,
  onApply,
}: {
  open: boolean;
  initialRules: FilterRule[];
  onClose: () => void;
  onApply: (rules: FilterRule[]) => void;
}) {
  const [rules, setRules] = useState<FilterRule[]>(initialRules);
  const [view, setView] = useState<'builder' | 'picker'>('picker');
  const [pickTarget, setPickTarget] = useState<number | 'new' | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  if (!open) return null;

  const openFieldPicker = (target: number | 'new') => {
    setPickTarget(target);
    setView('picker');
  };

  const pickField = (field: string) => {
    setRules((prev) => {
      if (pickTarget === null || pickTarget === 'new') {
        return [
          ...prev,
          { id: Date.now(), field, operator: filterConditions(field)[0], value: '', nestedRules: [] },
        ];
      }
      return prev.map((r) =>
        r.id === pickTarget ? { ...r, field, operator: filterConditions(field)[0], value: '' } : r
      );
    });
    setView('builder');
  };

  const updateRule = (id: number, patch: Partial<FilterRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const deleteRule = (id: number) => setRules((prev) => prev.filter((r) => r.id !== id));

  const addNested = (id: number) =>
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              nestedRules: [
                ...r.nestedRules,
                {
                  id: Date.now(),
                  field: ALL_FILTER_FIELDS[0] ?? 'Full name',
                  operator: filterConditions(ALL_FILTER_FIELDS[0] ?? 'Full name')[0],
                  value: '',
                },
              ],
            }
          : r
      )
    );

  const updateNested = (ruleId: number, nestedId: number, patch: Partial<NestedFilterRule>) =>
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, nestedRules: r.nestedRules.map((n) => (n.id === nestedId ? { ...n, ...patch } : n)) }
          : r
      )
    );

  const deleteNested = (ruleId: number, nestedId: number) =>
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, nestedRules: r.nestedRules.filter((n) => n.id !== nestedId) }
          : r
      )
    );

  const apply = () => {
    onApply(rules);
    onClose();
  };

  return (
    <DrawerShell
      title={view === 'picker' ? 'Select Filter Field' : 'Filters'}
      sub={
        view === 'picker'
          ? 'Choose a field to build a filter rule'
          : 'Build deep filter rules to narrow down the contact list'
      }
      icon={
        view === 'picker' ? (
          <button
            onClick={() => setView('builder')}
            className="w-full h-full flex items-center justify-center text-[#2563EB] hover:text-[#1D4ED8]"
            aria-label="Back to filter rules"
          >
            <FaArrowLeft className="text-sm" />
          </button>
        ) : (
          <FaFilter className="text-sm" />
        )
      }
      onClose={onClose}
      footer={
        view === 'picker' ? null : (
          <div className="px-4 py-3.5 bg-white border-t border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => setRules([])}
              className="text-xs text-[#64748B] hover:text-red-500 font-medium transition"
            >
              Clear all filters
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#1E293B] text-xs font-semibold rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={apply}
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                Apply
              </button>
            </div>
          </div>
        )
      }
    >
      {view === 'picker' ? (
        <div className="flex-1 flex flex-col min-h-0">
          <GroupedMultiPanel
            groups={FILTER_GROUPS}
            selected={new Set<string>()}
            onToggle={() => {}}
            onClear={() => {}}
            collapsedState={collapsed}
            onToggleCollapsed={(id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))}
            search={search}
            onSearchChange={setSearch}
            onOpenProperties={pickField}
            selectable={false}
            className="flex-1 min-h-0"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {rules.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
              <FaFilter className="text-[#CBD5E1] text-2xl mb-2 mx-auto" />
              <p className="text-xs text-[#64748B] font-medium">No filter rules configured.</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">Click "Add Filter" below to start deep filtering.</p>
            </div>
          ) : (
            rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onPickField={() => openFieldPicker(rule.id)}
                onOperator={(op) => updateRule(rule.id, { operator: op })}
                onValue={(value) => updateRule(rule.id, { value })}
                onDelete={() => deleteRule(rule.id)}
                onAddNested={() => addNested(rule.id)}
                onNestedField={(nid, field) =>
                  updateNested(rule.id, nid, { field, operator: filterConditions(field)[0] })
                }
                onNestedOperator={(nid, op) => updateNested(rule.id, nid, { operator: op })}
                onNestedValue={(nid, value) => updateNested(rule.id, nid, { value })}
                onNestedDelete={(nid) => deleteNested(rule.id, nid)}
              />
            ))
          )}
          <button
            onClick={() => openFieldPicker('new')}
            className="w-full px-3 py-2 border border-dashed border-[#94A3B8] hover:border-[#2563EB] hover:text-[#2563EB] bg-white text-[#64748B] text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition"
          >
            <FaPlus className="text-[10px]" />
            <span>Add Filter</span>
          </button>
        </div>
      )}
    </DrawerShell>
  );
}

function RuleCard({
  rule,
  onPickField,
  onOperator,
  onValue,
  onDelete,
  onAddNested,
  onNestedField,
  onNestedOperator,
  onNestedValue,
  onNestedDelete,
}: {
  rule: FilterRule;
  onPickField: () => void;
  onOperator: (op: string) => void;
  onValue: (value: string) => void;
  onDelete: () => void;
  onAddNested: () => void;
  onNestedField: (id: number, field: string) => void;
  onNestedOperator: (id: number, op: string) => void;
  onNestedValue: (id: number, value: string) => void;
  onNestedDelete: (id: number) => void;
}) {
  const valueProp = getFilterProperties(rule.field)[1];
  const operatorOptions = filterConditions(rule.field);
  const valueHidden = rule.operator === 'Is empty' || rule.operator === 'Is not empty' || valueProp?.type === 'none';

  return (
    <div className="border border-[#E2E8F0] bg-white rounded-xl p-3.5 space-y-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onPickField}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#1E293B] hover:border-[#93C5FD] transition"
          title="Choose a different field"
        >
          <span className="truncate">{rule.field}</span>
          <FaPen className="text-[10px] text-[#94A3B8]" />
        </button>
        <div className="relative">
          <select
            value={rule.operator}
            onChange={(e) => onOperator(e.target.value)}
            className="w-full appearance-none px-3 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-8"
          >
            {operatorOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <FaChevronDown className="absolute right-3 top-3 text-[10px] text-[#94A3B8] pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!valueHidden && (
          <div className="flex-1 min-w-0">
            <ValueControl valueProp={valueProp} value={rule.value} onChange={onValue} />
          </div>
        )}
        <button
          onClick={onDelete}
          className="p-2 border border-[#E2E8F0] hover:border-red-200 hover:bg-red-50 text-[#94A3B8] hover:text-red-500 rounded-lg transition flex-shrink-0"
          title="Delete filter rule"
        >
          <FaTrashCan className="text-sm" />
        </button>
      </div>

      {rule.nestedRules.length > 0 && (
        <div className="pl-3 border-l-2 border-[#2563EB66] space-y-2 mt-1">
          {rule.nestedRules.map((nested) => (
            <div
              key={nested.id}
              className="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0] text-xs"
            >
              <span className="text-[#2563EB] font-bold uppercase text-[10px] flex-shrink-0">AND</span>
              <select
                value={nested.field}
                onChange={(e) => onNestedField(nested.id, e.target.value)}
                className="max-w-[130px] flex-shrink-0 px-2 py-1 bg-white border border-[#E2E8F0] rounded-md text-[11px] text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer"
                title="Nested field"
              >
                {ALL_FILTER_FIELDS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <select
                value={nested.operator}
                onChange={(e) => onNestedOperator(nested.id, e.target.value)}
                className="flex-shrink-0 px-2 py-1 bg-white border border-[#E2E8F0] rounded-md text-[11px] text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                {filterConditions(nested.field).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {!(nested.operator === 'Is empty' || nested.operator === 'Is not empty') &&
                getFilterProperties(nested.field)[1]?.type !== 'none' && (
                  <div className="flex-1 min-w-0">
                    <ValueControl
                      valueProp={getFilterProperties(nested.field)[1]}
                      value={nested.value}
                      onChange={(v) => onNestedValue(nested.id, v)}
                    />
                  </div>
                )}
              <button
                onClick={() => onNestedDelete(nested.id)}
                className="text-[#94A3B8] hover:text-red-500 p-1 flex-shrink-0"
                aria-label="Remove nested filter"
              >
                <FaXmark className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onAddNested}
        className="text-xs text-[#64748B] hover:text-[#2563EB] font-medium flex items-center gap-1.5 pt-1 transition"
      >
        <FaPlus className="text-[10px]" />
        <span>Add nested filter</span>
      </button>
    </div>
  );
}

function ValueControl({
  valueProp,
  value,
  onChange,
  disabled,
}: {
  valueProp?: FilterProperty;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const { staff } = useStaff();
  const baseCls =
    'w-full px-3 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition disabled:opacity-50';

  const type = valueProp?.type ?? 'text';

  if (type === 'none') return null;

  if (type === 'date-options') {
    return <DateValueControl value={value} onChange={onChange} disabled={disabled} baseCls={baseCls} />;
  }

  if (type === 'age') {
    return <AgeValueControl value={value} onChange={onChange} disabled={disabled} baseCls={baseCls} />;
  }

  if (type === 'campaigns') {
    return (
      <RemoteValueControl
        loadOptions={() => api.listCampaigns(valueProp?.status)}
        placeholder={valueProp?.placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        baseCls={baseCls}
      />
    );
  }

  if (type === 'workflows') {
    return (
      <RemoteValueControl
        loadOptions={() => api.listWorkflows(valueProp?.status)}
        placeholder={valueProp?.placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        baseCls={baseCls}
      />
    );
  }

  if (type === 'select' || type === 'users' || type === 'countries' || type === 'timezones') {
    if (type === 'users') {
      return (
        <OptionSelect
          options={staff.map((s) => s.full_name || s.first_name || s.last_name).filter(Boolean)}
          value={value}
          onChange={onChange}
          disabled={disabled}
          baseCls={baseCls}
          placeholder="Select a user"
        />
      );
    }
    const options =
      type === 'countries' ? COUNTRIES : type === 'timezones' ? timezones.map((t) => t.value) : (valueProp?.options ?? []);
    return (
      <OptionSelect
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        baseCls={baseCls}
        placeholder={type === 'countries' ? 'Select a country' : type === 'timezones' ? 'Select a timezone' : (valueProp?.placeholder ?? 'Select a value')}
      />
    );
  }

  const inputType =
    type === 'number' || type === 'date' || type === 'email' || type === 'phone' ? type : 'text';

  return (
    <input
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={valueProp?.placeholder ?? 'Type here'}
      disabled={disabled}
      className={baseCls}
    />
  );
}

function OptionSelect({
  options,
  value,
  onChange,
  disabled,
  baseCls,
  placeholder,
  showEmptyOption = true,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  baseCls: string;
  placeholder: string;
  showEmptyOption?: boolean;
}) {
  return (
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${baseCls} appearance-none cursor-pointer pr-8`}
      >
        {showEmptyOption && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <FaChevronDown className="absolute right-3 top-3 text-[10px] text-[#94A3B8] pointer-events-none transition group-hover:opacity-0" />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Clear selection"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 hidden group-hover:flex items-center justify-center text-[#94A3B8] hover:text-red-500 transition"
        >
          <FaXmark className="text-xs" />
        </button>
      )}
    </div>
  );
}

function RemoteValueControl({
  loadOptions,
  placeholder,
  value,
  onChange,
  disabled,
  baseCls,
}: {
  loadOptions: () => Promise<{ data: { name: string }[]; count: number }>;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  baseCls: string;
}) {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    setOptions([]);
    loadOptions()
      .then((res) => {
        if (alive) setOptions(res.data.map((c) => c.name).filter(Boolean));
      })
      .catch(() => {
        if (alive) setOptions([]);
      });
    return () => {
      alive = false;
    };
  }, [loadOptions]);

  return (
    <OptionSelect
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      baseCls={baseCls}
      placeholder={placeholder ?? 'Select an option'}
    />
  );
}

function DateValueControl({
  value,
  onChange,
  disabled,
  baseCls,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  baseCls: string;
}) {
  const parts = value.split('|');
  const opt = parts[0] ?? '';
  const first = parts[1] ?? '';
  const second = parts[2] ?? '';
  const unit = parts[3] ?? 'Days';
  const needsDate = opt === 'On' || opt === 'Between' || opt === 'After date' || opt === 'Before date';
  const needsNumber = opt === 'More than' || opt === 'Less than' || opt === 'In the next' || opt === 'In the last';

  const emit = (op: string, a: string, b: string, u?: string) => {
    const unitChunk = u ?? 'Days';
    const chunks = [op, a, op === 'Between' && b ? b : '', unitChunk];
    onChange(chunks.join('|'));
  };

  return (
    <div className="space-y-1.5">
      <OptionSelect
        options={DATE_VALUE_OPTIONS}
        value={opt}
        onChange={(v) => emit(v, '', '')}
        disabled={disabled}
        baseCls={baseCls}
        placeholder="Select date range"
      />
      {needsDate && (
        <div className={opt === 'Between' ? 'grid grid-cols-2 gap-1.5' : ''}>
          <input
            type="date"
            value={first}
            disabled={disabled}
            onChange={(e) => emit(opt, e.target.value, second)}
            className={opt === 'Between' ? baseCls : `${baseCls} w-full`}
          />
          {opt === 'Between' && (
            <input
              type="date"
              value={second}
              disabled={disabled}
              onChange={(e) => emit(opt, first, e.target.value)}
              className={baseCls}
            />
          )}
        </div>
      )}
      {needsNumber && (
        <div className="grid grid-cols-[1fr_110px] gap-1.5">
          <input
            type="number"
            value={first}
            disabled={disabled}
            onChange={(e) => emit(opt, e.target.value, '', unit)}
            placeholder="Enter number"
            className={baseCls}
          />
          <OptionSelect
            options={DATE_UNITS}
            value={unit}
            onChange={(u) => emit(opt, first, '', u)}
            disabled={disabled}
            baseCls={baseCls}
            placeholder="Unit"
            showEmptyOption={false}
          />
        </div>
      )}
    </div>
  );
}

function AgeValueControl({
  value,
  onChange,
  disabled,
  baseCls,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  baseCls: string;
}) {
  const parts = value.split('|');
  const q = parts[0] ?? 'Equals to';
  const first = parts[1] ?? '';
  const second = parts[2] ?? '';
  const unit = parts[3] ?? 'Years';

  const emit = (quality: string, a: string, b: string, u?: string) => {
    const unitChunk = u ?? 'Years';
    const chunks = [quality, a, quality === 'Between' && b ? b : '', unitChunk];
    onChange(chunks.join('|'));
  };

  return (
    <div className="space-y-1.5">
      <OptionSelect
        options={AGE_VALUE_OPTIONS}
        value={q}
        onChange={(v) => emit(v, '', '')}
        disabled={disabled}
        baseCls={baseCls}
        placeholder="Select age condition"
      />
      <div className="grid grid-cols-[1fr_110px] gap-1.5">
        <div className={q === 'Between' ? 'grid grid-cols-2 gap-1.5' : ''}>
          <input
            type="number"
            value={first}
            disabled={disabled}
            onChange={(e) => emit(q, e.target.value, second, unit)}
            placeholder="Age"
            className={q === 'Between' ? baseCls : `${baseCls} w-full`}
          />
          {q === 'Between' && (
            <input
              type="number"
              value={second}
              disabled={disabled}
              onChange={(e) => emit(q, first, e.target.value, unit)}
              placeholder="To age"
              className={baseCls}
            />
          )}
        </div>
        <OptionSelect
          options={AGE_UNITS}
          value={unit}
          onChange={(u) => emit(q, first, second, u)}
          disabled={disabled}
          baseCls={baseCls}
          placeholder="Unit"
          showEmptyOption={false}
        />
      </div>
    </div>
  );
}

export function TableSortDrawer({
  open,
  initialSort,
  onClose,
  onApply,
}: {
  open: boolean;
  initialSort: string;
  onClose: () => void;
  onApply: (sortBy: string) => void;
}) {
  const [sortBy, setSortBy] = useState(initialSort);
  const [search, setSearch] = useState('');

  if (!open) return null;

  return (
    <DrawerShell
      title="Sort by"
      sub={sortBy ? `Sorted by: ${sortBy}` : 'Select a column to sort contacts'}
      icon={<FaArrowsUpDown className="text-sm" />}
      onClose={onClose}
      footer={
        <div className="px-4 py-3.5 bg-white border-t border-[#E2E8F0] flex items-center justify-end space-x-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#1E293B] text-xs font-semibold rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApply(sortBy);
              onClose();
            }}
            className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-sm transition"
          >
            Apply
          </button>
        </div>
      }
    >
      <div className="flex-1 flex flex-col min-h-0">
        <GroupedSinglePanel
          options={SORT_OPTIONS}
          value={sortBy}
          onSelect={setSortBy}
          search={search}
          onSearchChange={setSearch}
          className="flex-1 min-h-0"
        />
      </div>
    </DrawerShell>
  );
}
