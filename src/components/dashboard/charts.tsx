import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { FaArrowTrendUp, FaArrowTrendDown, FaPhone } from 'react-icons/fa6';
import { STATUS_COLORS, STATUS_META } from './widgetMeta';
import type { DealerLeadStatus } from '../../api';

const PALETTE = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#6366f1',
  '#f97316',
];

Chart.defaults.font.family =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

/** Smoothly counts up to `target` for animated number widgets. */
function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h
        .split('')
        .map((c) => c + c)
        .join('')
    : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(59,130,246,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function useChart(
  type: 'doughnut' | 'bar' | 'line',
  labels: string[],
  values: number[],
  colors: string[],
  horizontal = false,
  cutout = '62%',
  lineColor = '#3b82f6',
  fill = true
) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const isDoughnut = type === 'doughnut';
    const isLine = type === 'line';
    const ctx = ref.current.getContext('2d');
    if (!ctx) return;

    // Gradient fills make line/bar charts feel richer while keeping the
    // same data underneath.
    const datasetBackgroundColor: unknown = isDoughnut
      ? colors
      : isLine
      ? (context: { chart: Chart }) => {
          const area = context.chart.chartArea;
          if (!area) return hexToRgba(lineColor, 0.15);
          const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
          g.addColorStop(0, hexToRgba(lineColor, 0.32));
          g.addColorStop(1, hexToRgba(lineColor, 0.02));
          return g;
        }
      : (context: { chart: Chart; dataIndex: number }) => {
          const c = colors[context.dataIndex % colors.length] ?? '#3b82f6';
          const area = context.chart.chartArea;
          if (!area) return c;
          const g =
            horizontal && type === 'bar'
              ? ctx.createLinearGradient(area.left, 0, area.right, 0)
              : ctx.createLinearGradient(0, area.bottom, 0, area.top);
          g.addColorStop(0, `${c}55`);
          g.addColorStop(1, c);
          return g;
        };

    chartRef.current = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: [
          {
            label: '',
            data: values,
            backgroundColor: datasetBackgroundColor as string,
            borderColor: isDoughnut ? '#ffffff' : isLine ? lineColor : colors,
            borderWidth: isDoughnut ? 3 : isLine ? 2.5 : 1,
            borderRadius: type === 'bar' ? 6 : 0,
            borderSkipped: false,
            fill: isLine && fill,
            tension: isLine ? 0.4 : 0,
            pointRadius: isLine ? 0 : undefined,
            pointHoverRadius: isLine ? 5 : undefined,
            pointHoverBorderWidth: isLine ? 2 : undefined,
            hoverOffset: isDoughnut ? 8 : undefined,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: type === 'bar' && horizontal ? 'y' : 'x',
        cutout: isDoughnut ? cutout : undefined,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            displayColors: false,
          },
        },
        scales:
          type === 'doughnut'
            ? undefined
            : {
                x: {
                  grid: { display: isLine || horizontal, color: '#f1f5f9' },
                  border: { display: false },
                  ticks: { font: { size: 10 }, color: '#94a3b8' },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#f1f5f9' },
                  border: { display: false },
                  ticks: { font: { size: 10 }, color: '#94a3b8', precision: 0 },
                },
              },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
    };
  }, [type, labels, values, colors, horizontal, cutout, lineColor, fill]);

  return ref;
}

export function DonutChart({
  labels,
  values,
  colors,
  centerText,
  cutout = '62%',
}: {
  labels: string[];
  values: number[];
  colors?: string[];
  centerText?: string;
  cutout?: string;
}) {
  const palette = colors ?? PALETTE.slice(0, labels.length);
  const ref = useChart('doughnut', labels, values, palette, false, cutout);
  const total = values.reduce((s, v) => s + v, 0);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-1 h-full min-h-[150px]">
      <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex-shrink-0">
        <canvas ref={ref} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-none">{centerText ?? total}</span>
          {centerText && <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">of total</span>}
        </div>
      </div>
      <div className="w-full sm:w-auto sm:flex-1 sm:min-w-0 space-y-2 text-xs">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: palette[i], boxShadow: `0 0 0 3px ${palette[i]}22` }}
            />
            <span className="text-slate-600 font-medium truncate">{l}</span>
            <span className="ml-auto font-bold text-slate-800 flex-shrink-0">{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  labels,
  values,
  colors,
  horizontal,
}: {
  labels: string[];
  values: number[];
  colors?: string[];
  horizontal?: boolean;
}) {
  const ref = useChart('bar', labels, values, colors ?? PALETTE.slice(0, labels.length), horizontal);
  return (
    <div className="h-36">
      <canvas ref={ref} />
    </div>
  );
}

export function LineChart({
  labels,
  values,
  color = '#3b82f6',
  fill = true,
}: {
  labels: string[];
  values: number[];
  color?: string;
  fill?: boolean;
}) {
  const ref = useChart('line', labels, values, [color], false, '62%', color, fill);
  return (
    <div className="h-40">
      <canvas ref={ref} />
    </div>
  );
}

export function FunnelChart({
  stages,
}: {
  stages: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="flex flex-col gap-2.5 py-1">
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-medium text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="font-bold text-slate-800">{s.value}</span>
            </div>
            <div className="w-full h-7 rounded-full overflow-hidden bg-slate-100 relative">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${s.color}bb, ${s.color})`,
                  transitionDelay: `${i * 90}ms`,
                }}
              />
              <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-semibold text-slate-500">
                {i === 0 ? '100%' : `${pct}%`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NumberCard({
  value,
  sub,
  delta,
  accent,
}: {
  value: number | string;
  sub?: string;
  delta?: { value: number; up: boolean };
  accent?: string;
}) {
  // Animate plain numeric values (12, "1,234"); composite strings like
  // "5 / 12" or "Rs 0" render as-is.
  const raw = typeof value === 'number' ? String(value) : String(value).trim();
  const numeric = /^\d{1,3}(,\d{3})*$|^\d+$/.test(raw) ? parseInt(raw.replace(/,/g, ''), 10) : null;
  const animated = useCountUp(numeric ?? 0);
  const display = numeric !== null ? animated.toLocaleString('en-US') : value;

  return (
    <div className="h-full flex flex-col justify-center min-w-0">
      <div className={`text-2xl sm:text-[28px] font-extrabold tracking-tight leading-none ${accent ?? 'text-slate-800'}`}>
        {display}
      </div>
      {sub && <div className="text-[11px] text-slate-500 mt-1.5 truncate">{sub}</div>}
      {delta !== undefined && (
        <div
          className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-1.5 px-1.5 py-0.5 rounded-full w-fit ${
            delta.up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
          }`}
        >
          {delta.up ? <FaArrowTrendUp /> : <FaArrowTrendDown />}
          {delta.value}%
        </div>
      )}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  onRowClick,
}: {
  columns: string[];
  rows: (string | number)[][];
  onRowClick?: (row: (string | number)[]) => void;
}) {
  return (
    <div className="h-full overflow-auto custom-horizontal-scrollbar max-h-[300px]">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 border-b border-slate-200">
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={`py-2 px-3 ${i === 0 ? 'pl-4' : ''} whitespace-nowrap`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-600">
          {rows.map((row, r) => (
            <tr
              key={r}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-slate-50 transition' : ''}
            >
              {row.map((cell, c) => (
                <td key={c} className={`py-2 px-3 ${c === 0 ? 'pl-4 font-medium text-slate-800' : ''} whitespace-nowrap`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadStageList({
  leads,
  onOpenContact,
}: {
  leads: { contactId: number; name: string; phone: string | null; status: DealerLeadStatus }[];
  onOpenContact?: (id: number) => void;
}) {
  return (
    <div className="h-full overflow-auto max-h-[340px]">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 border-b border-slate-200">
          <tr>
            <th className="py-2 px-3 pl-4">Lead</th>
            <th className="py-2 px-3">Stage</th>
            <th className="py-2 px-3 text-right pr-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-600">
          {leads.map((l) => (
            <tr key={l.contactId} className={onOpenContact ? 'cursor-pointer hover:bg-slate-50 transition' : ''}>
              <td className="py-2 px-3 pl-4">
                <div className="font-medium text-slate-800 truncate">{l.name}</div>
                {l.phone && <div className="text-[10px] text-slate-400">{l.phone}</div>}
              </td>
              <td className="py-2 px-3">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: `${STATUS_COLORS[l.status]}1a`, color: STATUS_COLORS[l.status] }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[l.status] }} />
                  {STATUS_META[l.status].label}
                </span>
              </td>
              <td className="py-2 px-3 text-right pr-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenContact?.(l.contactId);
                  }}
                  className="text-[10px] text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <FaPhone className="text-[9px]" /> Open
                </button>
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-[11px] text-slate-400">
                No leads assigned yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_ACTIONS: DealerLeadStatus[] = ['non_contacted', 'contacted', 'closed', 'customer', 'rejected'];

/**
 * Interactive lead list for dealers/followers: each row shows the current
 * status and one-tap buttons to move the lead into any pipeline stage. The
 * change is saved immediately and the owner (admin) is notified.
 */
export function LeadStatusList({
  leads,
  onChange,
  onOpenContact,
}: {
  leads: { contactId: number; name: string; phone: string | null; status: DealerLeadStatus }[];
  onChange?: (contactId: number, status: DealerLeadStatus) => void;
  onOpenContact?: (id: number) => void;
}) {
  return (
    <div className="h-full overflow-auto max-h-[340px]">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 border-b border-slate-200">
          <tr>
            <th className="py-2 px-3 pl-4">Lead</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3 pr-4">Update status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-600">
          {leads.map((l) => (
            <tr key={l.contactId} className={onOpenContact ? 'cursor-pointer hover:bg-slate-50 transition' : ''}>
              <td
                className="py-2 px-3 pl-4"
                onClick={() => onOpenContact?.(l.contactId)}
              >
                <div className="font-medium text-slate-800 truncate">{l.name}</div>
                {l.phone && <div className="text-[10px] text-slate-400">{l.phone}</div>}
              </td>
              <td className="py-2 px-3">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: `${STATUS_COLORS[l.status]}1a`, color: STATUS_COLORS[l.status] }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[l.status] }} />
                  {STATUS_META[l.status].label}
                </span>
              </td>
              <td className="py-2 px-3 pr-4">
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {STATUS_ACTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (l.status !== s) onChange?.(l.contactId, s);
                      }}
                      disabled={l.status === s}
                      title={l.status === s ? `Already ${STATUS_META[s].label}` : `Mark as ${STATUS_META[s].label}`}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border transition ${
                        l.status === s
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                          : 'text-slate-600 border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                      }`}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-[11px] text-slate-400">
                No leads assigned yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}