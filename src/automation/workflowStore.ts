import type { Workflow, WorkflowEdge, WorkflowNode } from './types';
import { getNodeType } from './nodeCatalog';

const STORAGE_KEY = 'evee_workflows_v1';

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDate(d: Date): string {
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
}

export function makeNode(type: string, x: number, y: number): WorkflowNode {
  return { id: uid('node'), type, name: getNodeType(type).defaultName, x, y, settings: {} };
}

export function makeEdge(from: string, fromPort: number, to: string, toPort: number): WorkflowEdge {
  return { id: uid('edge'), from, fromPort, to, toPort };
}

const SEED_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-fast5',
    name: 'Fast 5 Lite',
    status: 'Draft',
    nodes: [
      makeNode('form-submitted', 320, 120),
      { ...makeNode('send-email', 320, 300), name: 'Welcome Email' },
      { ...makeNode('add-tag', 320, 480), name: 'Tag: New Lead' },
    ],
    edges: [
      makeEdge('', 0, '', 0),
    ],
    createdAt: 'Aug 08 2026, 2:37 PM',
    updatedAt: 'Aug 08 2026, 2:37 PM',
    enrolled: 0,
    activeEnrolled: 0,
  },
  {
    id: 'wf-1786790279405',
    name: 'New Workflow : 1786790279405',
    status: 'Draft',
    nodes: [],
    edges: [],
    createdAt: 'Aug 15 2026, 3:38 PM',
    updatedAt: 'Aug 15 2026, 3:38 PM',
    enrolled: 0,
    activeEnrolled: 0,
  },
  {
    id: 'wf-1786790315818',
    name: 'New Workflow : 1786790315818',
    status: 'Draft',
    nodes: [],
    edges: [],
    createdAt: 'Aug 15 2026, 3:42 PM',
    updatedAt: 'Aug 15 2026, 3:38 PM',
    enrolled: 0,
    activeEnrolled: 0,
  },
];

// Fix the seeded "Fast 5" chain edges by wiring the three seeded nodes properly.
function seedChain() {
  const wf = SEED_WORKFLOWS[0];
  if (wf.nodes.length === 3 && wf.edges.length === 1 && wf.edges[0].from === '') {
    wf.edges = [
      makeEdge(wf.nodes[0].id, 0, wf.nodes[1].id, 0),
      makeEdge(wf.nodes[1].id, 0, wf.nodes[2].id, 0),
    ];
  }
}
seedChain();

export function loadWorkflows(): Workflow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Workflow[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore corrupted storage */
  }
  return JSON.parse(JSON.stringify(SEED_WORKFLOWS));
}

export function persistWorkflows(list: Workflow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore storage errors */
  }
}

export function createWorkflowRecord(name?: string): Workflow {
  const ts = formatDate(new Date());
  const id = uid('wf');
  return {
    id,
    name: name ?? `New Workflow : ${Date.now()}`,
    status: 'Draft',
    nodes: [],
    edges: [],
    createdAt: ts,
    updatedAt: ts,
    enrolled: 0,
    activeEnrolled: 0,
  };
}