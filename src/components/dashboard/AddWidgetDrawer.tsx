import { useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaArrowTrendUp,
  FaChartColumn,
  FaChartLine,
  FaChartPie,
  FaChevronDown,
  FaFilter,
  FaMagnifyingGlass,
  FaTableCells,
  FaXmark,
} from 'react-icons/fa6';
import {
  WIDGET_CATEGORIES,
  WIDGET_DEFS,
  filterDefsForRole,
  type DashboardDataset,
  type WidgetChartType,
  type WidgetDef,
  type WidgetRole,
} from './widgets';
import { WidgetConfigPanel, type WidgetConfigResult } from './WidgetConfig';

const TABS = ['Widgets', 'Elements', 'Themes', 'Custom metrics'];

const CHART_TYPES: (WidgetChartType | 'all')[] = ['all', 'number', 'donut', 'line', 'bar', 'funnel', 'table'];

function ChartTypeIcon({ type }: { type: WidgetChartType }) {
  switch (type) {
    case 'number':
      return <span className="font-bold">#</span>;
    case 'donut':
      return <FaChartPie />;
    case 'line':
      return <FaChartLine />;
    case 'bar':
      return <FaChartColumn />;
    case 'funnel':
      return <FaFilter />;
    case 'table':
      return <FaTableCells />;
    default:
      return <FaArrowTrendUp />;
  }
}

function CategoryGroup({
  name,
  items,
  count,
  expanded,
  onToggle,
  onConfigure,
}: {
  name: string;
  items: WidgetDef[];
  count: number;
  expanded: boolean;
  onToggle: () => void;
  onConfigure: (def: WidgetDef) => void;
}) {
  return (
    <div className="accordion-item border-b border-slate-100 pb-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2.5 text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <FaChevronDown
            className={`text-[10px] text-slate-400 group-hover:text-blue-600 transition-transform duration-200 ${
              expanded ? 'rotate-180' : '-rotate-90'
            }`}
          />
          <span>{name}</span>
        </div>
        <span className="text-[10px] font-semibold bg-emerald-100/70 text-emerald-700 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </button>
      {expanded && (
        <div className="space-y-2 py-2 pr-0.5 text-xs text-slate-600">
          {items.length === 0 ? (
            <div className="px-2.5 py-2 text-[11px] text-slate-400 italic">No widgets in this category yet.</div>
          ) : (
            items.map((w) => (
              <div
                key={w.id}
                onClick={() => onConfigure(w)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-evee-widget', w.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                title="Click to configure, or drag onto the dashboard to add instantly"
                className="p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-sm hover:border-blue-400 hover:shadow cursor-grab active:cursor-grabbing flex items-center gap-3 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                  <span className="text-xs">
                    <ChartTypeIcon type={w.chartType} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                    {w.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{w.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AddWidgetDrawer({
  open,
  onClose,
  role,
  dataset,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  role: WidgetRole;
  dataset: DashboardDataset;
  onAdd: (defId: string, cfg?: WidgetConfigResult) => void;
}) {
  const [tab, setTab] = useState('Widgets');
  const [search, setSearch] = useState('');
  const [chartType, setChartType] = useState<WidgetChartType | 'all'>('all');
  const [dropHint, setDropHint] = useState(false);
  const [configuring, setConfiguring] = useState<WidgetDef | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    [role === 'Admin' ? 'Contacts' : 'Opportunities']: true,
  }));

  const defs = useMemo(() => filterDefsForRole(WIDGET_DEFS, role), [role]);

  const categories = useMemo(() => {
    const map = new Map<string, WidgetDef[]>();
    for (const w of defs) {
      const list = map.get(w.category) ?? [];
      list.push(w);
      map.set(w.category, list);
    }
    return WIDGET_CATEGORIES.map((name) => ({ name, items: map.get(name) ?? [] }));
  }, [defs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return categories
      .map((c) => ({
        name: c.name,
        items: c.items.filter(
          (w) =>
            (chartType === 'all' || w.chartType === chartType) &&
            (!q || w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q))
        ),
      }))
      .filter((c) => c.items.length > 0 || !q);
  }, [categories, search, chartType]);

  if (!open) return null;

  const toggleCategory = (name: string) => setExpanded((v) => ({ ...v, [name]: !v[name] }));

  const isWidgetDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('application/x-evee-widget');

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 transition-colors ${dropHint ? 'bg-blue-900/25' : 'bg-slate-900/20'} backdrop-blur-[1px]`}
        onClick={onClose}
        onDragOver={(e) => {
          if (!isWidgetDrag(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          if (!dropHint) setDropHint(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDropHint(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDropHint(false);
          const defId = e.dataTransfer.getData('application/x-evee-widget');
          if (defId) onAdd(defId);
        }}
      >
        {dropHint && (
          <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-blue-400/80 rounded-2xl bg-blue-50/30 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-blue-700 bg-white/90 px-3 py-1.5 rounded-full shadow">
              Release to add widget
            </span>
          </div>
        )}
      </div>
      <aside className="absolute right-0 top-0 h-full w-80 sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
        {/* Drawer header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {configuring && (
              <button
                onClick={() => setConfiguring(null)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition flex-shrink-0"
                title="Back to widget list"
              >
                <FaArrowLeft className="text-xs" />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">
                {configuring ? `Configure: ${configuring.title}` : 'Add new widget'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                {configuring
                  ? 'Choose how this widget should look'
                  : 'Click a widget to configure it, or drag to add'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex-shrink-0">
            <FaXmark className="text-sm" />
          </button>
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          {configuring ? (
            <WidgetConfigPanel
              def={configuring}
              dataset={dataset}
              submitLabel="Add to dashboard"
              onSubmit={(cfg) => onAdd(configuring.id, cfg)}
              onCancel={() => setConfiguring(null)}
            />
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center border-b border-slate-200 px-3 text-xs font-semibold text-slate-600 space-x-5 pt-2">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`pb-2.5 border-b-2 transition-colors ${
                      tab === t ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === 'Widgets' ? (
                <div className="p-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <FaMagnifyingGlass className="absolute left-3 top-2.5 text-xs text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search widget"
                      className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                    />
                  </div>

                  {/* Chart type filter icons */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600">Chart type</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {CHART_TYPES.map((t) => {
                        const active = chartType === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setChartType(t)}
                            className={
                              active
                                ? 'px-2.5 py-1 text-xs font-semibold border border-blue-600 text-blue-600 bg-blue-50/50 rounded transition-colors'
                                : 'px-2.5 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded transition-colors'
                            }
                          >
                            {t === 'all' ? (
                              'All'
                            ) : (
                              <span className="flex items-center justify-center">
                                <ChartTypeIcon type={t} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Categories accordion */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    {filtered.map((c) => (
                      <CategoryGroup
                        key={c.name}
                        name={c.name}
                        items={c.items}
                        count={c.items.length}
                        expanded={!!expanded[c.name] && c.items.length > 0}
                        onToggle={() => toggleCategory(c.name)}
                        onConfigure={setConfiguring}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">{tab} coming soon.</div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
