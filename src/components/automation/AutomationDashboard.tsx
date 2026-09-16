import { useEffect, useRef, useState } from 'react';
import {
  FaArrowUpFromBracket,
  FaBullhorn,
  FaChevronDown,
  FaCircleNodes,
  FaEllipsisVertical,
FaFileLines,
  FaFilter,
  FaFolder,
  FaGaugeHigh,
  FaGear,
  FaMagnifyingGlass,
  FaPen,
  FaPlus,
  FaRegCirclePlay,
  FaRegCopy,
  FaRegTrashCan,
  FaRotateLeft,
  FaSitemap,
  FaWandMagicSparkles,
  FaXmark,
} from 'react-icons/fa6';
import { useAuth } from '../../auth';
import UserMenu from '../UserMenu';
import NotificationsBell from '../NotificationsBell';
import WorkflowEditor from './WorkflowEditor';
import type { Workflow } from '../../automation/types';
import { createWorkflowRecord, loadWorkflows, persistWorkflows } from '../../automation/workflowStore';

type View = 'list' | 'editor';

interface AutomationDashboardProps {
  onNotify: (msg: string) => void;
  onLogout?: () => void;
}

export default function AutomationDashboard({ onNotify, onLogout }: AutomationDashboardProps) {
  const { user } = useAuth();
  const [view, setView] = useState<View>('list');
  const [workflows, setWorkflows] = useState<Workflow[]>(() => loadWorkflows());
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [dotsMenu, setDotsMenu] = useState<{ wf: Workflow; top: number; left: number } | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => persistWorkflows(workflows), [workflows]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDotsMenu(null);
        setCreateMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const updateWorkflow = (id: string, patch: Partial<Workflow>) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : w))
    );
    if (activeWorkflow?.id === id) setActiveWorkflow((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const openEditor = (wf: Workflow) => {
    setActiveWorkflow(JSON.parse(JSON.stringify(wf)));
    setView('editor');
  };

  const backToList = () => {
    setView('list');
    setActiveWorkflow(null);
    setDotsMenu(null);
  };

  const createWorkflow = (name?: string) => {
    const wf = createWorkflowRecord(name);
    setWorkflows((prev) => [wf, ...prev]);
    setCreateMenuOpen(false);
    openEditor(wf);
    onNotify(name ? `Created "${name}"` : 'New workflow created');
  };

  const duplicateWorkflow = (wf: Workflow) => {
    const copy: Workflow = {
      ...JSON.parse(JSON.stringify(wf)),
      id: `wf-copy-${Date.now()}`,
      name: `${wf.name} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setWorkflows((prev) => [copy, ...prev]);
    setDotsMenu(null);
    onNotify(`Duplicated "${wf.name}"`);
  };

  const deleteWorkflow = (wf: Workflow) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== wf.id));
    setDotsMenu(null);
    onNotify(`Deleted "${wf.name}"`);
  };

  const renameWorkflow = (wf: Workflow) => {
    const name = window.prompt('Rename workflow:', wf.name);
    if (name && name.trim()) {
      updateWorkflow(wf.id, { name: name.trim() });
      onNotify(`Renamed to "${name.trim()}"`);
    }
    setDotsMenu(null);
  };

  const publishWorkflow = (wf: Workflow) => {
    updateWorkflow(wf.id, { status: wf.status === 'Published' ? 'Draft' : 'Published' });
    onNotify(wf.status === 'Published' ? 'Workflow set to Draft' : `"${wf.name}" published!`);
    setDotsMenu(null);
  };

  const openDotsMenu = (e: React.MouseEvent, wf: Workflow) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDotsMenu({ wf, top: rect.bottom + 4, left: Math.max(8, rect.right - 220) });
  };

  const filtered = searchQuery.trim()
    ? workflows.filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : workflows;

  if (view === 'editor' && activeWorkflow) {
    return (
      <WorkflowEditor
        workflow={activeWorkflow}
        onPatch={(patch) => updateWorkflow(activeWorkflow.id, patch)}
        onBack={backToList}
        onNotify={onNotify}
        onRename={(name) => updateWorkflow(activeWorkflow.id, { name })}
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 text-slate-800 text-sm">
      {/* Top header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs gap-3">
        <div className="flex items-center space-x-6 min-w-0">
          <h1 className="text-base font-semibold text-slate-800">Automation</h1>
          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium">
            <span className="text-blue-600 border-b-2 border-blue-600 pb-2.5 pt-1 -mb-2.5 font-semibold">Workflows</span>
            <span className="text-slate-600 hover:text-slate-900 pb-2.5 pt-1 -mb-2.5 flex items-center space-x-1.5 cursor-pointer">
              <span>Overview</span>
              <span className="bg-amber-400 text-slate-900 font-bold text-[9px] px-1 py-0.5 rounded uppercase tracking-wider">Beta</span>
            </span>
            <span className="text-slate-600 hover:text-slate-900 pb-2.5 pt-1 -mb-2.5 flex items-center space-x-1.5 cursor-pointer">
              <FaGear className="text-slate-500 text-xs" />
              <span>Global Workflow Settings</span>
            </span>
          </nav>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
          <NotificationsBell onNotify={onNotify} />
          <button onClick={() => onNotify('Ask AI coming soon')} className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-full transition shadow-xs">
            <FaWandMagicSparkles className="text-[11px]" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
          <button onClick={() => onNotify('No new announcements')} className="relative p-2 text-slate-500 hover:text-slate-800 transition rounded-full hover:bg-slate-100" title="Announcements">
            <FaBullhorn className="text-xs" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border border-white" />
          </button>
          <div className="pl-1 border-l border-slate-100 ml-1">
            {user && <UserMenu user={user} onLogout={onLogout} />}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
        {/* Header actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-normal text-slate-900 tracking-tight">Workflows list</h2>
          <div className="flex items-center space-x-3">
            <button onClick={() => setFolderModalOpen(true)} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center space-x-2 transition">
              <FaFolder className="text-slate-500" />
              <span>Create folder</span>
            </button>
            <button onClick={() => setAiModalOpen(true)} className="bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-medium px-3.5 py-2 rounded-md shadow-xs flex items-center space-x-2 transition">
              <FaWandMagicSparkles className="text-purple-600" />
              <span>Build using AI</span>
            </button>

            <div className="relative">
              <button onClick={() => setCreateMenuOpen((v) => !v)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center space-x-1.5 transition">
                <FaPlus className="text-[10px]" />
                <span>Create workflow</span>
                <FaChevronDown className="text-[9px]" />
              </button>

              {createMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-slate-700">
                  <button onClick={() => createWorkflow()} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs font-medium flex items-center space-x-2.5 border-b border-slate-100">
                    <FaPlus className="text-slate-500 text-sm w-4 text-center" />
                    <span>Start from Scratch</span>
                  </button>
                  <button onClick={() => { setCreateMenuOpen(false); setAiModalOpen(true); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs font-medium flex items-center space-x-2.5">
                    <FaWandMagicSparkles className="text-purple-600 text-xs w-4 text-center" />
                    <span>Build Using AI</span>
                  </button>
                  <button onClick={() => { setCreateMenuOpen(false); onNotify('Template library coming soon'); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs font-medium flex items-center space-x-2.5">
                    <FaFileLines className="text-slate-500 text-xs w-4 text-center" />
                    <span>Select from Template</span>
                  </button>
                  <button onClick={() => { setCreateMenuOpen(false); onNotify('Campaign import coming soon'); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs font-medium flex items-center space-x-2.5">
                    <FaArrowUpFromBracket className="text-slate-500 text-xs w-4 text-center" />
                    <span>Import from a campaign</span>
                  </button>
                  <button onClick={() => { setCreateMenuOpen(false); onNotify('Company workflow coming soon'); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-xs font-medium flex items-center space-x-2.5">
                    <FaSitemap className="text-slate-500 text-xs w-4 text-center" />
                    <span>Company based workflow</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters & tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 text-xs font-medium">
            <div className="flex items-center space-x-6">
              <span className="text-blue-600 border-b-2 border-blue-600 pb-2.5 font-semibold">All workflows</span>
              <span className="text-slate-500 hover:text-slate-800 pb-2.5 cursor-pointer">Needs review (0)</span>
              <span className="text-slate-500 hover:text-slate-800 pb-2.5 cursor-pointer">Deleted</span>
              <span className="text-slate-500 hover:text-slate-800 pb-2.5 flex items-center space-x-1 cursor-pointer">
                <FaPlus className="text-[10px]" />
                <span>New smart list</span>
              </span>
            </div>
            <span className="text-slate-400 hover:text-slate-600 pb-2.5 flex items-center space-x-1 cursor-pointer">
              <FaGaugeHigh className="text-xs" />
              <span>Customize list</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <button onClick={() => onNotify('Advanced filters coming soon')} className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3.5 py-1.5 rounded-full flex items-center space-x-2 shadow-xs transition">
              <FaFilter className="text-slate-400 text-xs" />
              <span>Advanced filters</span>
            </button>

            <div className="relative">
              <FaMagnifyingGlass className="absolute left-3 top-2.5 text-slate-400 text-xs" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search"
                className="bg-white border border-slate-300 text-xs rounded-md pl-8 pr-3 py-1.5 w-60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder-slate-400 shadow-xs"
              />
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600 font-medium px-0.5">Home</div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="sm:hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No workflows found. Click "Create workflow" to get started.
              </div>
            ) : (
              filtered.map((wf) => (
                <div key={wf.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="pt-1">
                    <input type="checkbox" className="row-checkbox rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1" onClick={() => openEditor(wf)}>
                    <div className="flex items-center gap-2">
                      <FaCircleNodes className="text-blue-600 text-xs flex-shrink-0" />
                      <span className="font-medium text-slate-900 text-sm truncate">{wf.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${
                          wf.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {wf.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{wf.enrolled ?? 0} total</span>
                      <span>{wf.activeEnrolled ?? 0} active</span>
                      <span className="truncate">{wf.updatedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditor(wf)} className="p-2 text-slate-400 hover:text-blue-600" title="Open workflow">
                      <FaArrowUpFromBracket className="text-xs" />
                    </button>
                    <button onClick={(e) => openDotsMenu(e, wf)} className="p-2 text-slate-400 hover:text-slate-600" title="More options">
                      <FaEllipsisVertical />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4 w-10">
                    <div className="flex items-center space-x-1">
                      <input type="checkbox" checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Total enrolled</th>
                  <th className="py-3 px-3">Active enrolled</th>
                  <th className="py-3 px-3">Last updated</th>
                  <th className="py-3 px-3">Created on</th>
                  <th className="py-3 px-3 text-right pr-6">Stats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filtered.map((wf) => (
                  <tr key={wf.id} className="hover:bg-slate-50/80 transition group" onClick={() => openEditor(wf)}>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="row-checkbox rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" />
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <FaCircleNodes className="text-blue-600 text-xs" />
                        <span className="hover:text-blue-600 cursor-pointer">{wf.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${wf.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {wf.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-blue-600 hover:underline cursor-pointer">{wf.enrolled ?? 0}</td>
                    <td className="py-3 px-3 text-blue-600 hover:underline cursor-pointer">{wf.activeEnrolled ?? 0}</td>
                    <td className="py-3 px-3 text-slate-600">{wf.updatedAt}</td>
                    <td className="py-3 px-3 text-slate-600">{wf.createdAt}</td>
                    <td className="py-3 px-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-3 text-slate-400">
                        <button onClick={() => openEditor(wf)} className="hover:text-blue-600 p-1" title="Open workflow">
                          <FaArrowUpFromBracket className="text-[10px]" />
                        </button>
                        <button onClick={(e) => openDotsMenu(e, wf)} className="hover:text-slate-600 p-1">
                          <FaEllipsisVertical />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      No workflows found. Click "Create workflow" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-end space-x-2 text-xs">
            <button className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed font-medium">Previous</button>
            <button className="px-3 py-1.5 rounded-md border border-blue-600 text-blue-600 font-semibold bg-blue-50/40">1</button>
            <button className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed font-medium">Next</button>
          </div>
        </div>
      </main>

      {/* 3-dots action menu */}
      {dotsMenu && (
        <div ref={menuRef} className="fixed bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 w-48 text-xs text-slate-700 z-50 evee-pop" style={{ top: dotsMenu.top, left: dotsMenu.left }}>
          <button onClick={() => { const wf = dotsMenu.wf; setDotsMenu(null); openEditor(wf); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center space-x-2.5">
            <FaPen className="text-slate-500 w-4 text-center text-[10px]" />
            <span>Edit workflow</span>
          </button>
          <button onClick={() => renameWorkflow(dotsMenu.wf)} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center space-x-2.5">
            <FaRotateLeft className="text-slate-500 w-4 text-center text-[10px]" />
            <span>Rename workflow</span>
          </button>
          <button onClick={() => { const wf = dotsMenu.wf; setDotsMenu(null); openEditor(wf); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center space-x-2.5">
            <FaArrowUpFromBracket className="text-slate-500 w-4 text-center text-[10px]" />
            <span>Open in new tab</span>
          </button>
          <button onClick={() => publishWorkflow(dotsMenu.wf)} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center space-x-2.5">
            <FaRegCirclePlay className="text-slate-500 w-4 text-center text-[10px]" />
            <span>{dotsMenu.wf.status === 'Published' ? 'Unpublish workflow' : 'Publish workflow'}</span>
          </button>
          <button onClick={() => { setFolderModalOpen(true); setDotsMenu(null); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center space-x-2.5">
            <FaFolder className="text-slate-500 w-4 text-center text-[10px]" />
            <span>Move to folder</span>
          </button>
          <button onClick={() => duplicateWorkflow(dotsMenu.wf)} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center space-x-2.5">
            <FaRegCopy className="text-slate-500 w-4 text-center text-[10px]" />
            <span>Duplicate workflow</span>
          </button>
          <button onClick={() => deleteWorkflow(dotsMenu.wf)} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center space-x-2.5 text-red-600 hover:text-red-700">
            <FaRegTrashCan className="text-red-500 w-4 text-center text-[10px]" />
            <span>Delete workflow</span>
          </button>
        </div>
      )}

      {/* Create folder modal */}
      {folderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 evee-pop">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-800">Create Folder</h3>
              <button onClick={() => setFolderModalOpen(false)} className="text-slate-400 hover:text-slate-600"><FaXmark /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Folder Name</label>
              <input type="text" placeholder="e.g. Lead Nurturing Workflows" className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setFolderModalOpen(false)} className="px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setFolderModalOpen(false); onNotify('Folder created'); }} className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 font-medium">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Build using AI modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 evee-pop">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FaWandMagicSparkles className="text-purple-600" />
                <h3 className="text-base font-semibold text-slate-800">Build Workflow with AI</h3>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="text-slate-400 hover:text-slate-600"><FaXmark /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Describe what you want this workflow to do</label>
              <textarea rows={4} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., Send an email sequence when a new contact is added with the tag 'New Lead'..." className="w-full border border-slate-300 rounded-md p-3 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none" />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setAiModalOpen(false)} className="px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => {
                  const wf = createWorkflowRecord();
                  setWorkflows((prev) => [wf, ...prev]);
                  setAiModalOpen(false);
                  setAiPrompt('');
                  openEditor(wf);
                }}
                className="px-4 py-1.5 rounded bg-purple-600 text-white text-xs hover:bg-purple-700 font-medium"
              >
                Generate Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}