import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowUp,
  FaArrowUpRightFromSquare,
  FaCodeBranch,
  FaExpand,
  FaGear,
  FaMinus,
  FaPen,
  FaPlus,
  FaRegCopy,
  FaRegTrashCan,
  FaRotateLeft,
  FaRotateRight,
  FaWandMagicSparkles,
  FaXmark,
} from 'react-icons/fa6';
import type { Workflow, WorkflowEdge, WorkflowNode, NodeTypeDef } from '../../automation/types';
import { NODE_CATEGORIES, getNodeType } from '../../automation/nodeCatalog';
import { makeEdge, makeNode, uid } from '../../automation/workflowStore';
import { MAILGUN_CONFIG, sendEmailViaMailgun } from '../../services/mailgun';

const NODE_W = 216;
const NODE_H = 76;

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface WorkflowEditorProps {
  workflow: Workflow;
  onPatch: (patch: Partial<Workflow>) => void;
  onBack: () => void;
  onNotify: (msg: string) => void;
  onRename: (name: string) => void;
}

interface NodeSettingsFieldProps {
  node: WorkflowNode;
  onChange: (node: WorkflowNode) => void;
}

function NodeSettingsFields({ node, onChange }: NodeSettingsFieldProps) {
  const def = getNodeType(node.type);
  const set = (key: string, value: string) =>
    onChange({ ...node, settings: { ...node.settings, [key]: value } });

  return (
    <div className="space-y-2.5">
      {def.fields.map((field) => (
        <div key={field.key}>
          <label className="block text-[10px] font-medium text-slate-500 mb-1">{field.label}</label>
          {field.type === 'select' ? (
            <select
              value={node.settings[field.key] ?? def.defaults[field.key] ?? ''}
              onChange={(e) => set(field.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {field.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              rows={2}
              placeholder={field.placeholder}
              value={node.settings[field.key] ?? def.defaults[field.key] ?? ''}
              onChange={(e) => set(field.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              placeholder={field.placeholder}
              value={node.settings[field.key] ?? def.defaults[field.key] ?? ''}
              onChange={(e) => set(field.key, e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function NodeInspector({
  node,
  def,
  onPatchNode,
  onDuplicate,
  onDelete,
  onNotify,
}: {
  node: WorkflowNode;
  def: NodeTypeDef;
  onPatchNode: (n: WorkflowNode) => void;
  onDuplicate: (n: WorkflowNode) => void;
  onDelete: () => void;
  onNotify: (msg: string) => void;
}) {
  const Icon = def.icon;
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs" style={{ background: def.color }}>
            <Icon />
          </span>
          <div>
            <div className="text-[11px] font-semibold text-slate-800">{def.label}</div>
            <div className="text-[9px] text-slate-400">{def.kind === 'trigger' ? 'Trigger' : def.kind === 'logic' ? 'Logic' : 'Action'}</div>
          </div>
        </div>
        <div className="flex items-center space-x-0.5">
          <button onClick={() => onDuplicate(node)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded" title="Duplicate">
            <FaRegCopy className="text-[11px]" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
            <FaRegTrashCan className="text-[11px]" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-medium text-slate-500 mb-1">Name</label>
        <input
          value={node.name}
          onChange={(e) => onPatchNode({ ...node, name: e.target.value })}
          className="w-full border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <NodeSettingsFields node={node} onChange={onPatchNode} />

      <button
        onClick={() => onNotify(`Node "${node.name}" configured`)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md py-1.5 transition"
      >
        Save node
      </button>
    </div>
  );
}

function NodeCard({
  node,
  selected,
  running,
  done,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onStartConnect,
  onDoubleClick,
}: {
  node: WorkflowNode;
  selected: boolean;
  running: boolean;
  done: boolean;
  onSelect: (id: string) => void;
  onDragStart: (e: React.PointerEvent, node: WorkflowNode) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: () => void;
  onStartConnect: (e: React.PointerEvent, node: WorkflowNode, port: number) => void;
  onDoubleClick: (node: WorkflowNode) => void;
}) {
  const def = getNodeType(node.type);
  const Icon = def.icon;
  const hasInput = def.inputs > 0;
  const outputs = def.outputs;

  const outputXs = Array.from({ length: outputs }, (_, i) => ((i + 1) * NODE_W) / (outputs + 1));

  return (
    <div
      className={`absolute rounded-lg border shadow-sm transition-colors select-none ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : done
          ? 'border-emerald-400'
          : running
          ? 'border-amber-400 ring-2 ring-amber-200'
          : 'border-slate-300'
      }`}
      style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
      onPointerDown={(e) => onDragStart(e, node)}
      onPointerMove={(e) => onDragMove(e)}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      onDoubleClick={() => onDoubleClick(node)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {/* Input port */}
      {hasInput && (
        <div
          data-port={`input-${node.id}`}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartConnect(e, node, 0);
          }}
          className={`absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 cursor-crosshair transition ${
            running
              ? 'border-amber-500 bg-amber-100'
              : done
              ? 'border-emerald-500 bg-emerald-100'
              : 'border-slate-400 bg-white hover:bg-blue-500 hover:border-blue-500'
          }`}
          title="Input"
        />
      )}

      {/* Output ports */}
      {outputXs.map((px, i) => (
        <div
          key={i}
          data-port={`output-${node.id}-${i}`}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartConnect(e, node, i);
          }}
          className="absolute -bottom-[7px] w-3.5 h-3.5 rounded-full border-2 cursor-crosshair transition"
          style={{ left: px - 7, background: running ? '#fbbf24' : done ? '#34d399' : '#fff', borderColor: running ? '#f59e0b' : done ? '#10b981' : '#3b82f6' }}
          title={outputs > 1 ? `Output ${i === 0 ? 'True' : 'False'}` : 'Output'}
        />
      ))}

      {/* Card body */}
      <div className="flex flex-col h-full rounded-lg overflow-hidden bg-white">
        <div className="flex items-center gap-2 px-2.5 pt-2 pb-1.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shrink-0"
            style={{ background: def.color }}
          >
            <Icon />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-800 truncate leading-tight">{node.name}</div>
            <div className="text-[9px] text-slate-400 truncate">
              {def.kind === 'trigger' ? 'Trigger' : def.kind === 'logic' ? 'Logic' : 'Action'}
              {outputs > 1 ? ' · Branch' : ''}
            </div>
          </div>
        </div>
        <div className="px-2.5 pb-1.5 flex-1 overflow-hidden">
          <div className="text-[9px] text-slate-500 truncate bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 leading-tight">
            {summaryFor(node)}
          </div>
        </div>
      </div>

      {selected && (
        <div className="absolute top-1 right-1 flex flex-col gap-0.5 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDoubleClick(node);
            }}
            className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400 flex items-center justify-center text-[9px] shadow-sm"
            title="Open settings"
          >
            <FaGear />
          </button>
        </div>
      )}
    </div>
  );
}

function summaryFor(node: WorkflowNode): string {
  const def = getNodeType(node.type);
  const keys = Object.keys(node.settings);
  if (keys.length === 0) {
    return def.fields.length > 0 ? `Configure ${def.fields[0].label.toLowerCase()}…` : 'No parameters';
  }
  const parts = keys.map((k) => {
    const f = def.fields.find((f) => f.key === k);
    return f ? `${f.label}: ${node.settings[k] || '—'}` : '';
  });
  const nonEmpty = parts.filter(Boolean);
  return nonEmpty.join(' · ') || 'No parameters';
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dy = Math.max(36, (y2 - y1) / 2);
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
}

interface HistoryEntry {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface RunContext {
  contactName: string;
  email: string;
  phone: string;
  tags: string[];
}

function evaluateCondition(node: WorkflowNode, ctx: RunContext): boolean {
  const s = node.settings;
  const field = s.field || 'Tag';
  const op = s.operator || 'Contains';
  const val = s.value || '';
  const actual = String(
    field === 'Tag' ? ctx.tags.join(',') : field === 'Email' ? ctx.email : field === 'Phone' ? ctx.phone : ctx.contactName
  );
  switch (op) {
    case 'Contains':
      return actual.toLowerCase().includes(val.toLowerCase());
    case 'Is':
      return actual === val;
    case 'Is Not':
      return actual !== val;
    case 'Is Empty':
      return actual.trim() === '';
    default:
      return true;
  }
}

function fmtTemplate(tpl: string, ctx: RunContext): string {
  return tpl
    .replace(/\{\{\s*contact\.name\s*\}\}/g, ctx.contactName)
    .replace(/\{\{\s*contact\.email\s*\}\}/g, ctx.email)
    .replace(/\{\{\s*contact\.phone\s*\}\}/g, ctx.phone);
}

async function executeNode(node: WorkflowNode, ctx: RunContext): Promise<{ ok: boolean; message: string }> {
  const s = node.settings;
  const def = getNodeType(node.type);

  switch (node.type) {
    case 'form-submitted':
    case 'contact-created':
    case 'tag-added':
    case 'appointment-booked':
    case 'incoming-email':
    case 'incoming-call':
    case 'schedule':
    case 'webhook':
      return { ok: true, message: `Triggered: ${def.label}` };

    case 'send-email': {
      const to = (s.to || ctx.email).trim();
      const subject = fmtTemplate(s.subject || def.defaults.subject || '', ctx);
      const body = fmtTemplate(s.body || def.defaults.body || '', ctx);
      if (!to) return { ok: false, message: 'Send Email: no recipient configured' };
      try {
        const res = await sendEmailViaMailgun({
          fromEmail: MAILGUN_CONFIG.FROM_EMAIL,
          fromName: MAILGUN_CONFIG.FROM_NAME,
          to,
          subject,
          html: body,
          text: body,
        });
        return { ok: res.status !== 'failed', message: `Email ${res.status} to ${to}` };
      } catch (err) {
        return { ok: false, message: `Email failed: ${(err as Error).message}` };
      }
    }
    case 'send-sms':
      return { ok: true, message: `SMS queued to ${(s.to || ctx.phone) || '—'}` };
    case 'send-whatsapp':
      return { ok: true, message: `WhatsApp queued to ${(s.to || ctx.phone) || '—'}` };
    case 'add-tag':
      return { ok: true, message: `Tag "${s.tag || 'VIP'}" added to ${ctx.contactName}` };
    case 'remove-tag':
      return { ok: true, message: `Tag "${s.tag || 'VIP'}" removed from ${ctx.contactName}` };
    case 'create-task':
      return { ok: true, message: `Task created: "${s.title || 'Follow up'}"${s.assignee ? ` (assignee: ${s.assignee})` : ''}` };
    case 'create-opportunity':
      return { ok: true, message: `Opportunity created: "${s.name || ctx.contactName}" (${s.stage || 'New'})` };
    case 'update-contact':
      return { ok: true, message: `Contact ${s.field || 'Phone'} set to "${s.value || ''}"` };
    case 'book-appointment':
      return { ok: true, message: `Appointment "${s.title || 'Follow-up call'}" booked (+${s.days || '3'} days)` };
    case 'collect-payment':
      return { ok: true, message: `Payment of $${s.amount || '0'} collected for "${s.item || 'item'}"` };
    case 'add-campaign':
      return { ok: true, message: `Added to campaign "${s.campaign || 'Welcome Automation'}"` };
    case 'ai-agent':
      return { ok: true, message: `AI agent ran with ${s.model || 'GPT-4o'}` };
    case 'delay': {
      const amt = Math.max(0, Number(s.amount) || 0);
      const waitMs = Math.min(8000, amt * 600);
      await new Promise((r) => setTimeout(r, waitMs));
      return { ok: true, message: `Waited ${amt} ${s.unit || 'Minutes'} (scaled for test)` };
    }
    case 'condition': {
      const res = evaluateCondition(node, ctx);
      return {
        ok: true,
        message: `Condition "${s.field || 'Tag'} ${s.operator || 'Contains'} ${s.value || ''}" → ${res ? 'TRUE' : 'FALSE'} (took ${res ? 'True' : 'False'} branch)`,
      };
    }
    default:
      return { ok: true, message: `Executed ${def.label}` };
  }
}

export default function WorkflowEditor({
  workflow,
  onPatch,
  onBack,
  onNotify,
  onRename,
}: WorkflowEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 120, y: 60, zoom: 0.9 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'node' | 'workflow'>('node');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [runLog, setRunLog] = useState<{ nodeId: string; nodeName: string; type: string; ok: boolean; message: string }[]>([]);

  const [connect, setConnect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const historyRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const dragRef = useRef<{
    kind: 'node';
    nodeId: string;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; vx: number; vy: number } | null>(null);
  const connectRef = useRef<{ from: string; fromPort: number; x: number; y: number; isOutput: boolean } | null>(null);

  const nodes = workflow.nodes;
  const edges = workflow.edges;

  const pushHistory = useCallback(() => {
    historyRef.current.push({ nodes: JSON.parse(JSON.stringify(workflow.nodes)), edges: JSON.parse(JSON.stringify(workflow.edges)) });
    if (historyRef.current.length > 60) historyRef.current.shift();
    futureRef.current = [];
  }, [workflow.nodes, workflow.edges]);

  const setNodes = useCallback(
    (updater: (prev: WorkflowNode[]) => WorkflowNode[]) => {
      onPatch({ nodes: updater(workflow.nodes) });
    },
    [onPatch, workflow.nodes]
  );

  const setEdges = useCallback(
    (updater: (prev: WorkflowEdge[]) => WorkflowEdge[]) => {
      onPatch({ edges: updater(workflow.edges) });
    },
    [onPatch, workflow.edges]
  );

  const setSafeViewport = useCallback((updater: (v: Viewport) => Viewport) => {
    setViewport((v) => {
      const n = updater(v);
      return {
        x: Number.isFinite(n.x) ? n.x : v.x,
        y: Number.isFinite(n.y) ? n.y : v.y,
        zoom: Number.isFinite(n.zoom) ? Math.min(2.5, Math.max(0.2, n.zoom)) : v.zoom,
      };
    });
  }, []);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - viewport.x) / viewport.zoom,
        y: (clientY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  const portPosition = useCallback(
    (node: WorkflowNode, kind: 'input' | 'output', port = 0) => {
      if (kind === 'input') return { x: node.x + NODE_W / 2, y: node.y };
      const outputs = getNodeType(node.type).outputs;
      const px = ((port + 1) * NODE_W) / (outputs + 1);
      return { x: node.x + px, y: node.y + NODE_H };
    },
    []
  );

  // ----- Pointer handlers -----
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1) e.preventDefault();
    const target = e.target as HTMLElement;
    if (target.closest('[data-node-card]') || target.closest('[data-port]')) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, vx: viewport.x, vy: viewport.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedId(null);
    setInspectorOpen(false);
  };

  const handleNodePointerDown = (e: React.PointerEvent, node: WorkflowNode) => {
    e.stopPropagation();
    dragRef.current = {
      kind: 'node',
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
      moved: false,
    };
    setSelectedId(node.id);
    setInspectorTab('node');
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleNodeDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / viewport.zoom;
    const dy = (e.clientY - d.startY) / viewport.zoom;
    if (Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 3) d.moved = true;
    setNodes((prev) => prev.map((n) => (n.id === d.nodeId ? { ...n, x: d.nodeX + dx, y: d.nodeY + dy } : n)));
  };

  const handleNodeDragEnd = () => {
    if (dragRef.current?.moved) pushHistory();
    dragRef.current = null;
  };

  const handleStartConnect = (e: React.PointerEvent, node: WorkflowNode, port: number) => {
    e.stopPropagation();
    e.preventDefault();
    const portEl = e.currentTarget as HTMLElement;
    const isOutput = portEl.getAttribute('data-port')?.startsWith('output') ?? false;
    const def = getNodeType(node.type);
    if (isOutput) {
      const p = portPosition(node, 'output', port);
      connectRef.current = { from: node.id, fromPort: port, x: p.x, y: p.y, isOutput: true };
      setConnect({ x1: p.x, y1: p.y, x2: p.x, y2: p.y + 60 });
    } else if (def.inputs > 0) {
      const p = portPosition(node, 'input');
      connectRef.current = { from: node.id, fromPort: 0, x: p.x, y: p.y, isOutput: false };
      setConnect({ x1: p.x, y1: p.y, x2: p.x, y2: p.y - 60 });
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (panRef.current) {
      setSafeViewport((v) => ({
        ...v,
        x: panRef.current!.vx + (e.clientX - panRef.current!.startX),
        y: panRef.current!.vy + (e.clientY - panRef.current!.startY),
      }));
      return;
    }
    if (connectRef.current) {
      const w = screenToWorld(e.clientX, e.clientY);
      setConnect({
        x1: connectRef.current.x,
        y1: connectRef.current.y,
        x2: w.x,
        y2: w.y,
      });
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (connectRef.current) {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const portEl = el?.closest('[data-port]') as HTMLElement | null;
      const portKey = portEl?.getAttribute('data-port');
      if (portKey) {
        if (connectRef.current.isOutput && portKey.startsWith('input-')) {
          const to = portKey.replace('input-', '');
          const from = connectRef.current.from;
          const fromPort = connectRef.current.fromPort;
          if (from !== to) {
            const dup = edges.some((ed) => ed.from === from && ed.fromPort === fromPort && ed.to === to);
            if (!dup) {
              pushHistory();
              setEdges((prev) => [...prev, makeEdge(from, fromPort, to, 0)]);
              onNotify('Connected');
            }
          }
        } else if (!connectRef.current.isOutput && portKey.startsWith('output-')) {
          const parts = portKey.split('-');
          const fromPort = Number(parts[parts.length - 1]);
          const from = parts.slice(1, -1).join('-');
          const to = connectRef.current.from;
          if (from !== to) {
            const dup = edges.some((ed) => ed.from === from && ed.fromPort === fromPort && ed.to === to);
            if (!dup) {
              pushHistory();
              setEdges((prev) => [...prev, makeEdge(from, fromPort, to, 0)]);
              onNotify('Connected');
            }
          }
        }
      }
      connectRef.current = null;
      setConnect(null);
    }
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    panRef.current = null;
  };

  const addNode = useCallback(
    (type: string, x: number, y: number) => {
      pushHistory();
      const node = makeNode(type, x, y);
      setNodes((prev) => [...prev, node]);
      setSelectedId(node.id);
      return node;
    },
    [pushHistory, setNodes]
  );

  const handlePaletteDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/evee-node-type');
    if (!type) return;
    const w = screenToWorld(e.clientX, e.clientY);
    addNode(type, w.x - NODE_W / 2, w.y - NODE_H / 2);
  };

  const addNodeAtCenter = (type: string) => {
    const w = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    addNode(type, w.x - NODE_W / 2, w.y - NODE_H / 2);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    pushHistory();
    setNodes((prev) => prev.filter((n) => n.id !== selectedId));
    setEdges((prev) => prev.filter((ed) => ed.from !== selectedId && ed.to !== selectedId));
    setSelectedId(null);
    setInspectorOpen(false);
    setRunningIds((prev) => { const s = new Set(prev); s.delete(selectedId); return s; });
    setDoneIds((prev) => { const s = new Set(prev); s.delete(selectedId); return s; });
  };

  const duplicateNode = (node: WorkflowNode) => {
    pushHistory();
    const copy: WorkflowNode = { ...node, id: uid('node'), x: node.x + 40, y: node.y + 40, name: `${node.name} (copy)` };
    setNodes((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    onNotify(`Duplicated "${node.name}"`);
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push({ nodes: JSON.parse(JSON.stringify(workflow.nodes)), edges: JSON.parse(JSON.stringify(workflow.edges)) });
    onPatch({ nodes: prev.nodes, edges: prev.edges });
  };

  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push({ nodes: JSON.parse(JSON.stringify(workflow.nodes)), edges: JSON.parse(JSON.stringify(workflow.edges)) });
    onPatch({ nodes: next.nodes, edges: next.edges });
  };

  const zoomBy = (factor: number, center?: { x: number; y: number }) => {
    setSafeViewport((v) => {
      const next = Math.min(2.5, Math.max(0.2, v.zoom * factor));
      if (!center) return { ...v, zoom: next };
      return {
        ...v,
        zoom: next,
        x: center.x - ((center.x - v.x) / v.zoom) * next,
        y: center.y - ((center.y - v.y) / v.zoom) * next,
      };
    });
  };

  const fitToContent = () => {
    if (nodes.length === 0) {
      setViewport({ x: 120, y: 60, zoom: 0.9 });
      return;
    }
    const xs = nodes.map((n) => n.x).filter(Number.isFinite);
    const ys = nodes.map((n) => n.y).filter(Number.isFinite);
    if (xs.length === 0 || ys.length === 0) {
      setViewport({ x: 120, y: 60, zoom: 0.9 });
      return;
    }
    const minX = Math.min(...xs) - 60;
    const minY = Math.min(...ys) - 60;
    const maxX = Math.max(...xs) + NODE_W + 60;
    const maxY = Math.max(...ys) + NODE_H + 60;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width < 10 || rect.height < 10) return;
    const zoom = Math.min(1.5, Math.max(0.2, Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY))));
    setSafeViewport(() => ({
      zoom,
      x: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom,
      y: (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom,
    }));
  };

  const runWorkflow = async () => {
    const triggerIds = nodes.filter((n) => getNodeType(n.type).kind === 'trigger').map((n) => n.id);
    if (triggerIds.length === 0) {
      onNotify('Add a trigger node to test this workflow');
      return;
    }
    if (edges.length === 0) {
      onNotify('Connect a few nodes before testing');
      return;
    }
    setRunningIds(new Set());
    setDoneIds(new Set());
    setRunLog([]);

    const ctx: RunContext = {
      contactName: 'Test Lead',
      email: 'lead@example.com',
      phone: '+92 300 1234567',
      tags: ['New Lead'],
    };

    const order: string[] = [];
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      order.push(id);
      const node = nodes.find((n) => n.id === id);
      const out = edges.filter((ed) => ed.from === id);
      if (node && node.type === 'condition') {
        const res = evaluateCondition(node, ctx);
        out.forEach((ed) => {
          if ((res && ed.fromPort === 0) || (!res && ed.fromPort === 1)) visit(ed.to);
        });
      } else {
        out.forEach((ed) => visit(ed.to));
      }
    };
    triggerIds.forEach(visit);

    let failed = false;
    for (const id of order) {
      const node = nodes.find((n) => n.id === id);
      if (!node) continue;
      setRunningIds((prev) => new Set(prev).add(id));
      const res = await executeNode(node, ctx);
      if (!res.ok) failed = true;
      setRunningIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setDoneIds((prev) => new Set(prev).add(id));
      setRunLog((prev) => [...prev, { nodeId: node.id, nodeName: node.name, type: node.type, ok: res.ok, message: res.message }]);
    }
    onNotify(failed ? 'Workflow finished with errors' : 'Workflow executed successfully');
  };

  const generateFromAI = () => {
    if (!aiPrompt.trim()) {
      onNotify('Type a prompt to generate a workflow');
      return;
    }
    pushHistory();
    const baseX = 300;
    const trigger = makeNode('form-submitted', baseX, 100);
    const email = { ...makeNode('send-email', baseX, 300), name: 'Nurture Email' };
    const tag = { ...makeNode('add-tag', baseX, 500), name: 'Tag: Engaged' };
    const newNodes: WorkflowNode[] = [trigger, email, tag];
    const newEdges: WorkflowEdge[] = [
      makeEdge(trigger.id, 0, email.id, 0),
      makeEdge(email.id, 0, tag.id, 0),
    ];
    setNodes(() => [...nodes, ...newNodes]);
    setEdges(() => [...edges, ...newEdges]);
    setAiPrompt('');
    onNotify('AI workflow generated!');
  };

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const selectedDef = selectedNode ? getNodeType(selectedNode.type) : null;

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return NODE_CATEGORIES;
    return NODE_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((c) => c.items.length > 0);
  }, [searchQuery]);

  useEffect(() => {
    const onWindowUp = () => {
      connectRef.current = null;
      setConnect(null);
      panRef.current = null;
    };
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
    return () => {
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setInspectorOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-100 text-slate-800 text-sm select-none">
      {/* Editor Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition whitespace-nowrap"
          >
            <FaArrowUp className="text-[11px]" />
            <span>Workflows list</span>
          </button>
          <button
            onClick={() => onNotify('Workflow opens in new tab')}
            className="w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-xs"
            title="Open in new tab"
          >
            <FaArrowUpRightFromSquare />
          </button>

          <div className="flex items-center space-x-1.5 border border-transparent hover:border-slate-300 px-2 py-1 rounded transition group">
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[240px]">{workflow.name}</span>
            <button onClick={() => onRename(workflow.name)} className="text-slate-400 hover:text-slate-600 opacity-80 group-hover:opacity-100">
              <FaPen className="text-[11px]" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 text-xs">
          <button onClick={undo} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="Undo (Ctrl+Z)">
            <FaRotateLeft />
          </button>
          <button onClick={redo} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="Redo (Ctrl+Y)">
            <FaRotateRight />
          </button>

          <div className="flex items-center space-x-1 text-slate-500 text-xs px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px]">Saved</span>
          </div>

          <button
            onClick={runWorkflow}
            className="bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 text-xs px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap"
          >
            Test workflow
          </button>

          <div className="flex items-center space-x-2 bg-slate-100 px-2 py-1 rounded-md">
            <span className={`text-xs font-medium ${workflow.status === 'Published' ? 'text-emerald-600' : 'text-slate-600'}`}>
              {workflow.status}
            </span>
            <button
              onClick={() => {
                onPatch({ status: workflow.status === 'Published' ? 'Draft' : 'Published' });
                onNotify(workflow.status === 'Published' ? 'Workflow set to Draft' : 'Workflow published!');
              }}
              className={`relative w-8 h-4 rounded-full transition ${workflow.status === 'Published' ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span
                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${workflow.status === 'Published' ? 'left-[18px]' : 'left-0.5'}`}
              />
            </button>
            <span className="text-xs font-medium text-slate-400">Publish</span>
          </div>
        </div>
      </header>

      {/* Sub header tabs */}
      <div className="bg-white border-b border-slate-200 px-4 py-1 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-4 text-xs font-medium">
          <span className="bg-white border border-slate-200 text-slate-700 text-xs rounded px-2 py-1">Standard builder</span>
          <div className="flex items-center space-x-6 ml-4">
            <span className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1.5 -mb-1.5">Builder</span>
            <span className="text-slate-600 hover:text-slate-900 pb-1.5 cursor-pointer">Settings</span>
            <span className="text-slate-600 hover:text-slate-900 pb-1.5 cursor-pointer">Enrollment history</span>
            <span className="text-slate-600 hover:text-slate-900 pb-1.5 cursor-pointer">Execution logs</span>
          </div>
        </div>

        <button
          onClick={() => setPaletteOpen((v) => !v)}
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1 rounded shadow-xs flex items-center space-x-1.5"
        >
          <FaPlus className="text-slate-500 text-[10px]" />
          <span>Add</span>
        </button>
      </div>

      <div className="flex-1 flex flex-row-reverse min-h-0">
        {/* Node palette */}
        {paletteOpen && (
          <aside
            className="w-56 border-l border-slate-200 bg-white flex flex-col shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handlePaletteDrop}
          >
            <div className="p-2.5 border-b border-slate-100">
              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search nodes"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-md pl-8 pr-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                />
              </div>
              <div className="mt-1.5 text-[10px] text-slate-400">Drag nodes onto the canvas</div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1.5 space-y-2.5">
              {filteredCategories.map((cat) => (
                <div key={cat.name}>
                  <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                    <span>{cat.name}</span>
                    <span className="text-slate-300 font-normal">{cat.items.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/evee-node-type', item.key);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => addNodeAtCenter(item.key)}
                          className="w-full text-left px-2 py-1 rounded-md hover:bg-slate-50 flex items-center space-x-2 group transition"
                        >
                          <span
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] shrink-0"
                            style={{ background: item.color }}
                          >
                            <Icon />
                          </span>
                          <span className="text-[11px] font-medium text-slate-700 truncate">{item.label}</span>
                          <FaPlus className="ml-auto text-[9px] text-slate-300 group-hover:text-blue-500" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#f8fafc] min-w-0">
          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: `${22 * viewport.zoom}px ${22 * viewport.zoom}px`, backgroundPosition: `${viewport.x}px ${viewport.y}px` }} />

          <div
            ref={canvasRef}
            className="absolute inset-0 overflow-hidden"
            style={{ touchAction: 'none' }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            onDrop={handlePaletteDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="absolute" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0' }}>
              {/* Edges */}
              <svg className="absolute pointer-events-none" style={{ overflow: 'visible' }} width={1} height={1}>
                {edges.map((ed) => {
                  const fromNode = nodes.find((n) => n.id === ed.from);
                  const toNode = nodes.find((n) => n.id === ed.to);
                  if (!fromNode || !toNode) return null;
                  const p1 = portPosition(fromNode, 'output', ed.fromPort);
                  const p2 = portPosition(toNode, 'input');
                  const d = bezierPath(p1.x, p1.y, p2.x, p2.y);
                  return (
                    <path
                      key={ed.id}
                      d={d}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      className="pointer-events-none"
                    />
                  );
                })}
                {connect && (
                  <path d={bezierPath(connect.x1, connect.y1, connect.x2, connect.y2)} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 4" />
                )}
              </svg>

              {/* Nodes */}
              {nodes.map((node) => (
                <div key={node.id} data-node-card className="relative">
                  <NodeCard
                    node={node}
                    selected={node.id === selectedId}
                    running={runningIds.has(node.id)}
                    done={doneIds.has(node.id)}
                    onSelect={(id) => {
                      setSelectedId(id);
                      setInspectorTab('node');
                    }}
                    onDragStart={handleNodePointerDown}
                    onDragMove={handleNodeDragMove}
                    onDragEnd={handleNodeDragEnd}
                    onStartConnect={handleStartConnect}
                    onDoubleClick={(n) => {
                      setSelectedId(n.id);
                      setInspectorTab('node');
                      setInspectorOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AI prompt card */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-6">
              <div className="w-full max-w-lg pointer-events-auto bg-white border border-purple-200/80 rounded-xl p-5 shadow-sm evee-pop">
                <div className="flex flex-col items-center text-center mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px]">
                      <FaWandMagicSparkles />
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">What do you want to automate?</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Build workflows by chatting with AI, or drag nodes from the right</p>
                </div>
                <div className="relative bg-white border border-slate-200 rounded-lg p-2.5 shadow-xs focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500">
                  <textarea
                    rows={2}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="When contact form is submitted..."
                    className="w-full text-xs text-slate-800 focus:outline-none resize-none placeholder-slate-400"
                  />
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    <button onClick={generateFromAI} className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs hover:bg-purple-700 transition">
                      <FaArrowUp className="text-[10px]" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-2 mt-3 flex-wrap gap-y-1.5">
                  <button
                    onClick={() => setAiPrompt('Lead nurturing email campaign')}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-[11px] text-slate-700 px-2.5 py-1 rounded-full flex items-center space-x-1"
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Lead nurturing</span>
                  </button>
                  <button
                    onClick={() => setAiPrompt('Send email when new lead is added')}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-[11px] text-slate-700 px-2.5 py-1 rounded-full flex items-center space-x-1"
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Form automation</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty hint */}
          {nodes.length > 0 && (
            <div className="absolute left-4 top-3 z-10 text-[11px] text-slate-400 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-md px-2.5 py-1.5 shadow-xs">
              Drag to pan · scroll to zoom · double-click a node to edit
            </div>
          )}

          {/* Left bottom zoom controls */}
          <div className="absolute left-3 bottom-3 z-20 flex flex-col items-center space-y-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1.5 w-10">
            <button onClick={() => zoomBy(1.2)} className="p-1 hover:bg-slate-100 rounded text-slate-600 text-xs" title="Zoom in">
              <FaPlus />
            </button>
            <span className="text-[10px] font-semibold text-slate-600">{Math.round(viewport.zoom * 100)}%</span>
            <button onClick={() => zoomBy(0.8)} className="p-1 hover:bg-slate-100 rounded text-slate-600 text-xs" title="Zoom out">
              <FaMinus />
            </button>
            <button onClick={fitToContent} className="p-1 hover:bg-slate-100 rounded text-slate-600 text-xs" title="Fit to screen">
              <FaExpand />
            </button>
          </div>

          {/* Execution log */}
          {runLog.length > 0 && (
            <div className="absolute left-3 bottom-16 z-20 w-80 max-w-[calc(100%-6rem)] bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 evee-pop">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Execution log</span>
                <button onClick={() => setRunLog([])} className="text-slate-400 hover:text-slate-600 text-xs" title="Close">
                  <FaXmark />
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                {runLog.map((e, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-snug">
                    <span className={`mt-px flex-shrink-0 ${e.ok ? 'text-emerald-500' : 'text-red-500'}`}>{e.ok ? '✓' : '✕'}</span>
                    <div className="min-w-0">
                      <span className="text-slate-800 font-medium">{e.nodeName}: </span>
                      <span className="text-slate-500">{e.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Inspector (node settings drawer) */}
        {inspectorOpen && (
        <aside className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="flex border-b border-slate-100 text-xs font-medium">
            <button
              onClick={() => setInspectorTab('node')}
              className={`flex-1 py-2 text-center transition ${inspectorTab === 'node' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Node
            </button>
            <button
              onClick={() => setInspectorTab('workflow')}
              className={`flex-1 py-2 text-center transition ${inspectorTab === 'workflow' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Workflow
            </button>
          </div>

          {inspectorTab === 'workflow' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Workflow name</label>
                <input
                  value={workflow.name}
                  onChange={(e) => onRename(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Status</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600">{workflow.status}</span>
                  <button
                    onClick={() => {
                      onPatch({ status: workflow.status === 'Published' ? 'Draft' : 'Published' });
                      onNotify(workflow.status === 'Published' ? 'Workflow set to Draft' : 'Workflow published!');
                    }}
                    className={`relative w-9 h-5 rounded-full transition ${workflow.status === 'Published' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${workflow.status === 'Published' ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Triggered on</label>
                <select className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Any contact</option>
                  <option>New contacts only</option>
                  <option>Tagged contacts</option>
                </select>
              </div>
              <div className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-md p-2.5 leading-relaxed">
                <strong className="text-slate-500">{nodes.length}</strong> nodes · <strong className="text-slate-500">{edges.length}</strong> connections.
                <br />
                {workflow.createdAt} created.
              </div>
            </div>
          ) : selectedNode && selectedDef ? (
            <NodeInspector
              node={selectedNode}
              def={selectedDef}
              onPatchNode={(n) => setNodes((prev) => prev.map((x) => (x.id === n.id ? n : x)))}
              onDuplicate={duplicateNode}
              onDelete={deleteSelected}
              onNotify={onNotify}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <FaCodeBranch className="text-slate-300 text-2xl mb-2" />
              <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                Select a node on the canvas to edit its settings, or drag nodes from the palette.
              </p>
            </div>
          )}
        </aside>
        )}
      </div>
    </div>
  );
}