import type { IconType } from 'react-icons';

export type WorkflowStatus = 'Draft' | 'Published';

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  settings: Record<string, string>;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  fromPort: number;
  to: string;
  toPort: number;
}

export interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  enrolled?: number;
  activeEnrolled?: number;
}

export interface NodeFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  options?: string[];
  placeholder?: string;
}

export interface NodeTypeDef {
  key: string;
  label: string;
  category: string;
  kind: 'trigger' | 'action' | 'logic';
  icon: IconType;
  color: string;
  defaultName: string;
  inputs: number;
  outputs: number;
  fields: NodeFieldDef[];
  defaults: Record<string, string>;
}

export interface NodeCatalogCategory {
  name: string;
  items: NodeTypeDef[];
}