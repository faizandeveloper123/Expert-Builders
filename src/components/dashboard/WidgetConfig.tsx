import { useMemo, useState } from 'react';
import {
  FaArrowsRotate,
  FaChartColumn,
  FaChartLine,
  FaChartPie,
  FaFilter,
  FaPalette,
  FaPen,
  FaTableCells,
  FaXmark,
} from 'react-icons/fa6';
import { BarChart, DataTable, DonutChart, FunnelChart, LineChart } from './charts';
import {
  applyWidgetSettings,
  allowedDisplays,
  CHART_TYPE_LABELS,
  DEFAULT_PALETTE,
  resolveDisplay,
  type DashboardDataset,
  type WidgetChartType,
  type WidgetData,
  type WidgetDef,
  type WidgetInstance,
  type WidgetSettings,
} from './widgets';

export interface WidgetConfigResult {
  title: string;
  size: WidgetInstance['size'];
  settings: WidgetSettings;
}

const PRESETS: { name: string; colors: string[] }[] = [
  { name: 'Classic', colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'] },
  { name: 'Sunset', colors: ['#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#f59e0b'] },
  { name: 'Ocean', colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22d3ee', '#3b82f6', '#6366f1'] },
  { name: 'Forest', colors: ['#16a34a', '#22c55e', '#84cc16', '#10b981', '#059669', '#65a30d'] },
  { name: 'Candy', colors: ['#ec4899', '#f472b6', '#c084fc', '#818cf8', '#fb7185', '#f9a8d4'] },
];

function DisplayIcon({ t }: { t: WidgetChartType }) {
  switch (t) {
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
      return null;
  }
}

/** Compact live preview of a widget with its configured appearance. */
function Preview({ data }: { data: WidgetData }) {
  switch (data.kind) {
    case 'number':
      return (
        <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center px-2">
          <span className="text-3xl font-extrabold text-slate-800 leading-none">{String(data.value)}</span>
          {data.sub && <span className="text-[11px] text-slate-400 mt-1.5">{data.sub}</span>}
        </div>
      );
    case 'donut':
      return (
        <DonutChart
          labels={data.labels}
          values={data.values}
          colors={data.colors}
          centerText={data.centerText}
          cutout={data.cutout}
        />
      );
    case 'line':
      return (
        <div className="h-40">
          <LineChart labels={data.labels} values={data.values} color={data.color} fill={data.fill} />
        </div>
      );
    case 'bar':
      return (
        <div className="h-36">
          <BarChart labels={data.labels} values={data.values} colors={data.colors} horizontal={data.horizontal} />
        </div>
      );
    case 'funnel':
      return <FunnelChart stages={data.stages} />;
    case 'table':
      return <DataTable columns={data.columns} rows={data.rows.slice(0, 5)} />;
    default:
      return null;
  }
}

/**
 * Shared widget properties editor: live preview + display type
 * (number / donut / line / bar / funnel / table), colour palette and
 * chart-specific options. Used by both "Add Widget" (drawer) and the
 * per-widget Edit modal.
 */
export function WidgetConfigPanel({
  def,
  dataset,
  initialTitle,
  initialSize = 'md',
  initialSettings,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  def: WidgetDef;
  dataset: DashboardDataset;
  initialTitle?: string;
  initialSize?: WidgetInstance['size'];
  initialSettings?: WidgetSettings;
  submitLabel: string;
  onSubmit: (result: WidgetConfigResult) => void;
  onCancel: () => void;
}) {
  const raw = useMemo(() => def.compute(dataset), [def, dataset]);
  const allowed = useMemo(() => allowedDisplays(raw), [raw]);

  const [title, setTitle] = useState(initialTitle ?? def.title);
  const [size, setSize] = useState<WidgetInstance['size']>(initialSize);
  const [settings, setSettings] = useState<WidgetSettings>(initialSettings ?? {});

  const resolved = resolveDisplay(raw, settings);
  const preview = useMemo(() => applyWidgetSettings(raw, settings), [raw, settings]);
  const isSeries =
    raw.kind === 'donut' || raw.kind === 'line' || raw.kind === 'bar' || raw.kind === 'funnel';

  // Base colours from the widget's own data (fallback: default palette).
  const baseColors = useMemo(() => {
    if (raw.kind === 'funnel') return raw.stages.map((s) => s.color);
    if ((raw.kind === 'donut' || raw.kind === 'bar') && raw.colors) return raw.colors;
    return DEFAULT_PALETTE;
  }, [raw]);

  const slots = resolved === 'line' ? 1 : isSeries ? Math.min(8, Math.max(1, baseColors.length)) : 0;

  const effectiveColors = useMemo(() => {
    if (slots === 0) return [] as string[];
    const src = settings.palette && settings.palette.length > 0 ? settings.palette : baseColors;
    return Array.from({ length: slots }, (_, i) => src[i % src.length] ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]);
  }, [settings.palette, baseColors, slots]);

  const patch = (p: Partial<WidgetSettings>) => setSettings((v) => ({ ...v, ...p }));

  const setSlotColor = (i: number, value: string) => {
    const next = [...effectiveColors];
    next[i] = value;
    patch({ palette: next });
  };

  const resetPalette = () =>
    setSettings((v) => {
      const { palette, ...rest } = v;
      void palette;
      return rest;
    });

  const donutCutout = (() => {
    if (resolved !== 'donut') return null;
    if (settings.cutout) return parseInt(settings.cutout, 10) || 62;
    if (raw.kind === 'donut' && raw.cutout) return parseInt(raw.cutout, 10) || 62;
    return 62;
  })();

  return (
    <div className="flex flex-col h-full">
      {/* Live preview */}
      <div className="px-4 pt-4">
        <label className="text-[11px] font-semibold text-slate-600 mb-1.5 block">Live preview</label>
        <div className="h-48 rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden flex items-center justify-center p-2">
          <Preview data={preview} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {/* Title */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Widget title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Size */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 mb-1.5 block">Size on dashboard</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['sm', 'Small', 'w-1/4'],
                ['md', 'Medium', 'w-1/2'],
                ['lg', 'Full', 'w-full'],
              ] as const
            ).map(([key, label, previewBar]) => (
              <button
                key={key}
                onClick={() => setSize(key)}
                className={`px-2 py-2 rounded-md border text-[11px] font-medium transition ${
                  size === key
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                <span className={`h-1.5 ${previewBar} bg-slate-300 rounded mb-1.5 mx-auto block`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Display type */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 mb-1.5 block">Show as</label>
          {allowed.length > 1 ? (
            <div className="grid grid-cols-3 gap-2">
              {allowed.map((t) => {
                const active = resolved === t;
                return (
                  <button
                    key={t}
                    onClick={() => patch({ display: t })}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md border text-[10px] font-medium transition ${
                      active
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-sm">
                      <DisplayIcon t={t} />
                    </span>
                    {CHART_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic px-1">
              This widget always shows as {CHART_TYPE_LABELS[allowed[0]]}.
            </div>
          )}
        </div>

        {/* Colours */}
        {isSeries && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                <FaPalette className="text-[10px] text-slate-400" /> Chart colours
              </label>
              <button
                onClick={resetPalette}
                className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                title="Reset to default colours"
              >
                <FaArrowsRotate className="text-[9px]" /> Reset
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => patch({ palette: p.colors.slice(0, Math.max(slots, 1)) })}
                  title={`${p.name} palette`}
                  className="flex items-center rounded-full border border-slate-200 hover:border-blue-400 pl-1 pr-2 py-0.5 transition"
                >
                  <span className="flex -space-x-1 mr-1">
                    {p.colors.slice(0, 4).map((c) => (
                      <span key={c} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500">{p.name}</span>
                </button>
              ))}
            </div>

            {/* Per-series colour pickers */}
            <div className="flex items-center gap-2 flex-wrap">
              {effectiveColors.map((c, i) => (
                <label
                  key={i}
                  className="relative w-7 h-7 rounded-lg border border-slate-200 cursor-pointer shadow-xs overflow-hidden"
                  title={
                    preview.kind === 'funnel'
                      ? preview.stages[i]?.label
                      : preview.kind === 'donut' || preview.kind === 'bar'
                      ? preview.labels[i]
                      : 'Line colour'
                  }
                  style={{ backgroundColor: c }}
                >
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => setSlotColor(i, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Chart specific options */}
        {resolved === 'donut' && donutCutout !== null && (
          <div>
            <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
              Donut thickness <span className="text-slate-400 font-normal">({donutCutout}% hole)</span>
            </label>
            <input
              type="range"
              min={35}
              max={90}
              step={1}
              value={donutCutout}
              onChange={(e) => patch({ cutout: `${e.target.value}%` })}
              className="w-full accent-blue-600"
            />
          </div>
        )}

        {resolved === 'bar' && (
          <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.horizontal ?? false}
              onChange={(e) => patch({ horizontal: e.target.checked })}
              className="accent-blue-600 w-3.5 h-3.5"
            />
            Horizontal bars
          </label>
        )}

        {resolved === 'line' && (
          <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.fillArea ?? true}
              onChange={(e) => patch({ fillArea: e.target.checked })}
              className="accent-blue-600 w-3.5 h-3.5"
            />
            Fill area under line
          </label>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 flex justify-end gap-2 bg-white rounded-b-xl">
        <button
          onClick={onCancel}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit({ title: title.trim() || def.title, size, settings })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

/** Modal wrapper around the config panel for editing an existing widget. */
export function WidgetConfigModal({
  widget,
  def,
  dataset,
  onClose,
  onSave,
}: {
  widget: WidgetInstance;
  def: WidgetDef;
  dataset: DashboardDataset;
  onClose: () => void;
  onSave: (result: WidgetConfigResult) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FaPen className="text-blue-600 text-xs" /> Edit Widget
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-md hover:bg-slate-100">
            <FaXmark />
          </button>
        </div>
        <WidgetConfigPanel
          def={def}
          dataset={dataset}
          initialTitle={widget.title}
          initialSize={widget.size}
          initialSettings={widget.settings}
          submitLabel="Save Changes"
          onSubmit={onSave}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
