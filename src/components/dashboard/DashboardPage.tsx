import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaBars,
  FaBullhorn,
  FaEllipsisVertical,
  FaGaugeHigh,
  FaPen,
  FaPenToSquare,
  FaPhone,
  FaPlus,
  FaQuestion,
  FaRegCopy,
  FaRegTrashCan,
  FaWandMagicSparkles,
} from 'react-icons/fa6';
import { api, type ApiContact, type DealerDashboardDealer, type DealerLead, type DealerLeadStatus } from '../../api';
import { useAuth } from '../../auth';
import { BarChart, DataTable, DonutChart, FunnelChart, LeadStageList, LeadStatusList, LineChart, NumberCard } from './charts';
import { STATUS_META } from './widgetMeta';
import { AddWidgetDrawer } from './AddWidgetDrawer';
import { WidgetConfigModal, type WidgetConfigResult } from './WidgetConfig';
import {
  WIDGET_BY_ID,
  applyWidgetSettings,
  defaultInstancesForRole,
  isWidgetAllowedForRole,
  type DashboardDataset,
  type WidgetData,
  type WidgetInstance,
  type WidgetRole,
} from './widgets';
import AssignLeadsModal from './AssignLeadsModal';
import NotificationsBell from '../NotificationsBell';
import UserMenu from '../UserMenu';

const STORAGE_KEY = 'evee_dashboard_widgets_v3';

const OWNER_EMAIL = 'yadeapakistan@gmail.com';

const SIZE_CLASS: Record<WidgetInstance['size'], string> = {
  sm: 'col-span-6 sm:col-span-3',
  md: 'col-span-12 sm:col-span-6',
  lg: 'col-span-12',
};

const SKELETON_H: Record<WidgetInstance['size'], string> = {
  sm: 'h-[104px]',
  md: 'h-[204px]',
  lg: 'h-[236px]',
};

function WidgetBody({
  data,
  onOpenContact,
  onLeadStatusChange,
}: {
  data: WidgetData;
  onOpenContact?: (id: number) => void;
  onLeadStatusChange?: (contactId: number, status: DealerLeadStatus) => void;
}) {
  switch (data.kind) {
    case 'number':
      return <NumberCard value={data.value} sub={data.sub} accent={data.accent} />;
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
      return <LineChart labels={data.labels} values={data.values} color={data.color} fill={data.fill} />;
    case 'bar':
      return <BarChart labels={data.labels} values={data.values} colors={data.colors} horizontal={data.horizontal} />;
    case 'funnel':
      return <FunnelChart stages={data.stages} />;
    case 'table': {
      const contactIds = data.contactIds;
      if (!contactIds || !onOpenContact) {
        return <DataTable columns={data.columns} rows={data.rows} />;
      }
      return (
        <DataTable
          columns={data.columns}
          rows={data.rows}
          onRowClick={(row) => {
            const idx = data.rows.indexOf(row);
            const id = idx >= 0 ? contactIds[idx] : undefined;
            if (id) onOpenContact(id);
          }}
        />
      );
    }
    case 'lead-list':
      return <LeadStatusList leads={data.leads} onChange={onLeadStatusChange} onOpenContact={onOpenContact} />;
    case 'stage-list':
      return <LeadStageList leads={data.leads} onOpenContact={onOpenContact} />;
    default:
      return null;
  }
}

function WidgetCard({
  instance,
  dataset,
  index,
  dragIndex,
  overIndex,
  menuOpen,
  editMode,
  resizing,
  resizeSpan,
  resizeH,
  onOpenContact,
  onLeadStatusChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMenuToggle,
  onEdit,
  onDuplicate,
  onDelete,
  onResizeStart,
}: {
  instance: WidgetInstance;
  dataset: DashboardDataset;
  index: number;
  dragIndex: number | null;
  overIndex: number | null;
  menuOpen: boolean;
  editMode: boolean;
  resizing: boolean;
  resizeSpan: number | null;
  resizeH: number | null;
  onOpenContact?: (id: number) => void;
  onLeadStatusChange?: (contactId: number, status: DealerLeadStatus) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onMenuToggle: (uid: string) => void;
  onEdit: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onDelete: (uid: string) => void;
  onResizeStart: (e: React.PointerEvent, el: HTMLElement, uid: string) => void;
}) {
  const def = WIDGET_BY_ID[instance.defId];
  const data = useMemo(
    () => (def ? applyWidgetSettings(def.compute(dataset), instance.settings) : null),
    [def, dataset, instance.settings]
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onMenuToggle(instance.uid);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen, instance.uid, onMenuToggle]);

  if (!def || !data) return null;

  const effSpan = resizeSpan ?? instance.w;
  const effH = resizeH ?? instance.h;

  return (
    <section
      ref={sectionRef}
      draggable={!resizing}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      style={{
        animationDelay: `${Math.min(index * 55, 500)}ms`,
        ...(effSpan ? { gridColumn: `span ${effSpan} / span ${effSpan}` } : null),
        ...(effH ? { height: `${effH}px` } : null),
      }}
      className={`dash-in group relative bg-white border border-slate-200/70 rounded-xl shadow-xs overflow-hidden flex flex-col min-w-0 transition-shadow hover:shadow-md ${
        SIZE_CLASS[instance.size]
      } ${
        editMode ? 'border-blue-400 ring-2 ring-blue-200/60' : ''
      } ${overIndex === index && dragIndex !== null && dragIndex !== index ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
    >
      <header className="flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2 border-b border-slate-100 cursor-grab active:cursor-grabbing">
        <h3 className="font-semibold text-slate-500 text-[11px] uppercase tracking-wide truncate">{instance.title}</h3>
        <div className="relative flex-shrink-0 ml-2">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle(instance.uid);
            }}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ${
              editMode ? 'opacity-100 bg-blue-50 text-blue-600' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Widget options"
          >
            <FaEllipsisVertical className="text-xs" />
          </button>
          {menuOpen && (
            <div ref={menuRef} className="absolute right-0 top-7 z-30 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-44 text-xs">
              <button
                onClick={() => onEdit(instance.uid)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition"
              >
                <FaPen className="text-slate-400 text-[10px]" /> Edit
              </button>
              <button
                onClick={() => onDuplicate(instance.uid)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition"
              >
                <FaRegCopy className="text-slate-400 text-[10px]" /> Duplicate
              </button>
              <button
                onClick={() => onDelete(instance.uid)}
                className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium transition"
              >
                <FaRegTrashCan className="text-red-500 text-[10px]" /> Delete
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="flex-1 px-3 py-2.5 sm:px-3.5 sm:py-3 min-h-0">
        <WidgetBody data={data} onOpenContact={onOpenContact} onLeadStatusChange={onLeadStatusChange} />
      </div>
      {dragIndex !== null && overIndex === index && dragIndex !== index && (
        <div className="absolute inset-x-2 -top-1 h-1 bg-blue-500 rounded-full" />
      )}
      {resizing && <div className="absolute inset-0 border-2 border-blue-400/70 rounded-xl pointer-events-none" />}
      <div
        onPointerDown={(e) => {
          const el = sectionRef.current;
          if (!el) return;
          e.preventDefault();
          e.stopPropagation();
          onResizeStart(e, el, instance.uid);
        }}
        className={`absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-[3px] z-20 touch-none ${
          resizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        title="Drag to resize"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" className={resizing ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}>
          <path d="M9 1L1 9M9 5l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </section>
  );
}

function DashboardPage({
  onNotify,
  onOpenContact,
  onLogout,
  onOpenMobileSidebar,
}: {
  onNotify: (msg: string) => void;
  onOpenContact?: (id: number) => void;
  onLogout?: () => void;
  onOpenMobileSidebar?: () => void;
}) {
  const { user } = useAuth();
  const isOwner = user?.user_type === 'Admin' || user?.email?.toLowerCase() === OWNER_EMAIL;
  const role: WidgetRole = user?.user_type ?? 'Admin';
  const dealerId = user?.user_type === 'Follower' && user.manager_id != null ? user.manager_id : user?.id ?? 0;
  // Dashboard layout is saved per user so each role keeps its own widgets.
  const storageKey = user ? `evee_dashboard_widgets_v3_${user.id}` : STORAGE_KEY;

  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [dealers, setDealers] = useState<DealerDashboardDealer[]>([]);
  const [unassigned, setUnassigned] = useState(0);
  const [dealerLeads, setDealerLeads] = useState<DealerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [instances, setInstances] = useState<WidgetInstance[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as WidgetInstance[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (w) => w && typeof w.defId === 'string' && isWidgetAllowedForRole(w.defId, role)
          );
          if (valid.length > 0) return valid;
        }
      }
    } catch {
      /* ignore corrupted storage */
    }
    return defaultInstancesForRole(role);
  });

  // Re-filter saved widgets whenever the signed-in role changes (e.g. "Login as").
  useEffect(() => {
    setInstances((prev) => {
      const valid = prev.filter((w) => isWidgetAllowedForRole(w.defId, role));
      return valid.length > 0 ? valid : defaultInstancesForRole(role);
    });
  }, [role]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editUid, setEditUid] = useState<string | null>(null);
  const [menuUid, setMenuUid] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [resizePreview, setResizePreview] = useState<{ uid: string; span: number; h: number } | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const handleResizeStart = useCallback((e: React.PointerEvent, el: HTMLElement, uid: string) => {
    const grid = gridRef.current;
    if (!grid) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = el.getBoundingClientRect();
    const cs = getComputedStyle(grid);
    const gap = parseFloat(cs.columnGap) || 0;
    const unit = (grid.clientWidth - 11 * gap) / 12;
    let last = {
      span: Math.min(12, Math.max(1, Math.round((startRect.width + gap) / (unit + gap)))),
      h: Math.round(startRect.height),
    };
    document.body.style.userSelect = 'none';
    const onMove = (ev: PointerEvent) => {
      last = {
        span: Math.min(12, Math.max(1, Math.round((startRect.width + (ev.clientX - startX) + gap) / (unit + gap)))),
        h: Math.max(96, Math.round(startRect.height + (ev.clientY - startY))),
      };
      setResizePreview({ uid, ...last });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.userSelect = '';
      setResizePreview(null);
      setInstances((prev) =>
        prev.map((w) => (w.uid === uid ? { ...w, w: last.span, h: last.h } : w))
      );
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Non-owners only ever see contacts that belong to them (assigned or
      // followed) so a dealer/follower never gets global CRM data.
      const contactRes = await api.listContacts(isOwner ? {} : { restrict_to: user?.id ?? 0 });
      setContacts(contactRes.data);
      if (isOwner) {
        const sumRes = await api.dealerDashboardSummary();
        setDealers(sumRes.data.dealers);
        setUnassigned(sumRes.data.unassigned);
      } else {
        const leadsRes = await api.myLeads(user?.id ?? 0);
        setDealerLeads(leadsRes.data);
      }
    } catch (err) {
      onNotify(`Failed to load dashboard: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [isOwner, dealerId, onNotify, user]);

  useEffect(() => {
    void load();
  }, [load]);

  // Persist layout.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(instances));
    } catch {
      /* ignore storage errors */
    }
  }, [instances, storageKey]);

  const dataset = useMemo<DashboardDataset>(
    () => ({ isOwner, dealerId, contacts, dealers, unassigned, dealerLeads }),
    [isOwner, dealerId, contacts, dealers, unassigned, dealerLeads]
  );

  const addWidget = (defId: string, cfg?: WidgetConfigResult) => {
    const def = WIDGET_BY_ID[defId];
    if (!def) return;
    const title = cfg?.title?.trim() || def.title;
    setInstances((prev) => [
      ...prev,
      {
        uid: `w-${Date.now()}`,
        defId,
        title,
        size: cfg?.size ?? def.defaultSize,
        ...(cfg?.settings ? { settings: cfg.settings } : {}),
      },
    ]);
    setDrawerOpen(false);
    onNotify(`"${title}" added to dashboard`);
  };

  const handleLeadStatusChange = async (contactId: number, status: DealerLeadStatus) => {
    try {
      await api.updateDealerLeadStatus(contactId, { dealer_id: dealerId, status });
      onNotify(`Lead marked as ${STATUS_META[status].label}`);
      void load();
    } catch (err) {
      onNotify(`Update failed: ${(err as Error).message}`);
    }
  };

  const removeWidget = (uid: string) => {
    setInstances((prev) => prev.filter((w) => w.uid !== uid));
    setMenuUid(null);
  };

  const duplicateWidget = (uid: string) => {
    setInstances((prev) => {
      const idx = prev.findIndex((w) => w.uid === uid);
      if (idx === -1) return prev;
      const src = prev[idx];
      const copy: WidgetInstance = { ...src, uid: `w-${Date.now()}`, title: `${src.title} (copy)` };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setMenuUid(null);
    onNotify('Widget duplicated');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== overIndex) setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(null);
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    setInstances((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center flex-shrink-0 transition"
            aria-label="Open sidebar menu"
          >
            <FaBars className="text-base" />
          </button>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Dashboard View:</span>
            <select
              defaultValue="main"
              className="text-xs border border-slate-300 rounded px-2.5 py-1 font-medium bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="main">Main Overview</option>
              <option value="sales">Sales Performance</option>
              <option value="leads">Lead Generation</option>
            </select>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[10px] sm:text-xs font-semibold rounded shadow-sm transition-all hover:shadow-md"
          >
            <FaPlus className="text-[9px] hidden sm:inline" />
            <span>Add Widget</span>
          </button>
          {isOwner && (
            <button
              onClick={() => setAssignOpen(true)}
              className="flex items-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 text-[10px] sm:text-xs font-semibold rounded shadow-xs transition-colors"
            >
              <FaPlus className="text-[9px] hidden sm:inline" />
              <span>Assign Leads</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <button
            onClick={() => {
              if (!editMode) {
                setEditMode(true);
                setDrawerOpen(true);
              } else {
                setEditMode(false);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded shadow-sm transition-all ${
              editMode
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-md'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
            title="Toggle dashboard editing"
          >
            <FaPenToSquare className="text-[11px]" />
            <span className="hidden sm:inline">{editMode ? 'Done Editing' : 'Edit Dashboard'}</span>
          </button>

          <button
            onClick={() => onNotify('Dialer is not connected yet')}
            className="w-8 h-8 rounded-full bg-emerald-500 text-white items-center justify-center hover:bg-emerald-600 transition-colors shadow-xs hidden sm:flex"
            title="Dialer"
          >
            <FaPhone className="text-xs" />
          </button>

          <button
            onClick={() => onNotify('Ask AI coming soon')}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs font-medium rounded-full transition-all hover:shadow-md"
          >
            <FaWandMagicSparkles className="text-[11px]" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          <button
            onClick={() => onNotify('No new announcements')}
            className="relative p-2 text-slate-500 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100 hidden sm:flex"
            title="Announcements"
          >
            <FaBullhorn className="text-xs" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border border-white" />
          </button>

          <NotificationsBell onNotify={onNotify} />

          <button
            onClick={() => onNotify('Help center')}
            className="p-2 text-slate-500 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100 hidden sm:flex"
            title="Help"
          >
            <FaQuestion className="text-xs" />
          </button>

          <div className="pl-1 border-l border-slate-100 ml-1">
            {user && <UserMenu user={user} onLogout={onLogout} />}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {editMode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-[11px] rounded-md px-3 py-2 mb-4 flex items-center justify-between gap-2">
            <span>Editing dashboard — drag widgets to reorder, use the menu on each widget to edit, duplicate, or remove it.</span>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-xs transition-colors"
            >
              <FaPlus className="text-[10px]" /> Add Widget
            </button>
          </div>
        )}

        {loading && instances.length === 0 ? (
          <div className="grid grid-cols-12 gap-2 sm:gap-4" aria-busy="true" aria-label="Loading dashboard">
            {['sm', 'sm', 'md', 'md', 'md', 'lg'].map((s, i) => (
              <div
                key={i}
                className={`${SIZE_CLASS[s as WidgetInstance['size']]} ${SKELETON_H[s as WidgetInstance['size']]} dash-skeleton`}
              />
            ))}
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-12 gap-2 sm:gap-3">
            {instances.map((w, index) => (
              <WidgetCard
                key={w.uid}
                instance={w}
                dataset={dataset}
                index={index}
                dragIndex={dragIndex}
                overIndex={overIndex}
                menuOpen={menuUid === w.uid}
                editMode={editMode}
                resizing={resizePreview?.uid === w.uid}
                resizeSpan={resizePreview?.uid === w.uid ? resizePreview.span : null}
                resizeH={resizePreview?.uid === w.uid ? resizePreview.h : null}
                onOpenContact={onOpenContact}
                onLeadStatusChange={handleLeadStatusChange}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onMenuToggle={(uid) => setMenuUid((v) => (v === uid ? null : uid))}
                onResizeStart={handleResizeStart}
                onEdit={(uid) => {
                  setEditUid(uid);
                  setMenuUid(null);
                }}
                onDuplicate={duplicateWidget}
                onDelete={removeWidget}
              />
            ))}
          </div>
        )}

        {!loading && instances.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
              <FaGaugeHigh className="text-xl text-blue-500" />
            </div>
            <p className="font-semibold text-slate-600 text-xs mb-1">No widgets yet</p>
            <p className="text-[11px] text-slate-400 mb-3">Add charts and stats to build your perfect dashboard.</p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-semibold rounded-lg shadow-sm transition"
            >
              <FaPlus className="text-[10px]" /> Add your first widget
            </button>
          </div>
        )}
      </div>

      <AddWidgetDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
        dataset={dataset}
        onAdd={addWidget}
      />

      {editUid &&
        (() => {
          const w = instances.find((x) => x.uid === editUid);
          const def = w ? WIDGET_BY_ID[w.defId] : undefined;
          if (!w || !def) return null;
          return (
            <WidgetConfigModal
              widget={w}
              def={def}
              dataset={dataset}
              onClose={() => setEditUid(null)}
              onSave={(cfg) => {
                setInstances((prev) =>
                  prev.map((x) =>
                    x.uid === w.uid ? { ...x, title: cfg.title.trim() || x.title, size: cfg.size, settings: cfg.settings } : x
                  )
                );
                setEditUid(null);
                onNotify('Widget updated');
              }}
            />
          );
        })()}

      {assignOpen && (
        <AssignLeadsModal
          dealers={dealers}
          onClose={() => setAssignOpen(false)}
          onNotify={onNotify}
          onDone={() => {
            setAssignOpen(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

export default DashboardPage;