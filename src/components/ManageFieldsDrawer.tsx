import { useState } from 'react';
import {
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaGear,
  FaGripVertical,
  FaLock,
  FaMagnifyingGlass,
  FaPlus,
  FaXmark,
} from 'react-icons/fa6';
import { fieldById, fieldsInGroup, allFieldGroups } from '../data/tableFields';
import { useForms } from '../data/formsStore';

interface ManageFieldsDrawerProps {
  open: boolean;
  initialVisible: string[];
  onClose: () => void;
  onApply: (ids: string[]) => void;
  onNotify: (msg: string) => void;
}

function ManageFieldsDrawer({ open, initialVisible, onClose, onApply, onNotify }: ManageFieldsDrawerProps) {
  const [active, setActive] = useState<string[]>(initialVisible);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  useForms();

  if (!open) return null;

  const q = search.trim().toLowerCase();

  // Drop imported columns that duplicate a built-in column with the same label.
  const seenStaticLabels = new Set<string>();
  const activeList = active.filter((id) => {
    const f = fieldById(id);
    if (!f) return true;
    const norm = f.label.trim().toLowerCase();
    if (f.id.startsWith('import:') && seenStaticLabels.has(norm)) return false;
    if (!f.id.startsWith('import:')) seenStaticLabels.add(norm);
    return true;
  });

  const visibleActive = activeList.filter((id) => fieldById(id)?.label.toLowerCase().includes(q));

  const activeSet = new Set(active);

  const visibleGroups = allFieldGroups().map((g) => ({
    ...g,
    fields: fieldsInGroup(g.id).filter((f) => !activeSet.has(f.id) && f.label.toLowerCase().includes(q)),
  })).filter((g) => g.fields.length > 0);

  const toggleCollapsed = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const addField = (id: string) => {
    if (activeSet.has(id)) return;
    setActive((prev) => [...prev, id]);
  };

  const removeField = (id: string) => {
    const field = fieldById(id);
    if (field?.locked) return;
    setActive((prev) => prev.filter((x) => x !== id));
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    setActive((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const activeGroupCount = (gid: string) => activeList.filter((id) => fieldById(id)?.group === gid).length;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-[400px] max-w-[92vw] h-full bg-[#F8FAFC] shadow-2xl flex flex-col animate-[eveeSlideLeft_0.3s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="px-4 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2563EB1A] border border-[#93C5FD] flex items-center justify-center text-[#2563EB]">
              <FaGear className="text-sm" />
            </div>
            <h3 className="font-bold text-[#1E293B] text-sm">Manage fields</h3>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1E293B] transition">
            <FaXmark className="text-sm" />
          </button>
        </div>

        <div className="p-4 border-b border-[#E2E8F0] bg-white flex-shrink-0">
          <div className="relative flex items-center">
            <FaMagnifyingGlass className="absolute left-3 text-[#94A3B8] text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fields"
              className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs focus:outline-none focus:border-[#2563EB] placeholder-[#94A3B8]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Fields in table</span>
            <span className="text-[10px] font-semibold text-[#94A3B8]">{activeList.length}</span>
          </div>

          <div className="px-3 space-y-1.5">
            {visibleActive.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No matching fields</p>
            ) : (
              visibleActive.map((id, i) => {
                const field = fieldById(id);
                if (!field) return null;
                const isLocked = !!field.locked;
                const isOver = overIndex === i;
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={(e) => {
                      setDragIndex(i);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (overIndex !== i) setOverIndex(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex !== null) reorder(dragIndex, i);
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    className={`flex items-center gap-2 bg-white border rounded-lg px-2.5 py-2 cursor-grab transition ${
                      isOver ? 'border-[#2563EB] ring-[0_0_0_2px_rgba(37,99,235,0.15)]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    } ${dragIndex === i ? 'opacity-50' : ''}`}
                  >
                    <button
                      onClick={() => removeField(id)}
                      disabled={isLocked}
                      title={isLocked ? 'Contact name is required' : 'Remove from table'}
                      className="w-4 h-4 rounded-[5px] border flex items-center justify-center flex-shrink-0 transition disabled:cursor-not-allowed"
                      style={{ background: isLocked ? '#2563EB' : '#fff', borderColor: isLocked ? '#2563EB' : '#CBD5E1' }}
                    >
                      {isLocked && <FaCheck className="text-[8px] text-white" />}
                    </button>
                    <span className="text-[#94A3B8] flex-shrink-0" title="Drag to reorder">
                      <FaGripVertical className="text-xs" />
                    </span>
                    <span className="text-xs text-[#1E293B] font-medium truncate flex-1">{field.label}</span>
                    {isLocked && <FaLock className="text-[10px] text-[#94A3B8] flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 pt-5 pb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Add fields</span>
          </div>

          <div className="px-3 pb-4">
            {visibleGroups.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No matching fields</p>
            ) : (
              <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
                {visibleGroups.map((g, gi) => {
                  const isOpen = !collapsed[g.id];
                  return (
                    <div key={g.id} className={gi > 0 ? 'border-t border-[#F1F5F9]' : ''}>
                      <button
                        onClick={() => toggleCollapsed(g.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F8FAFC] transition"
                      >
                        <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                          {isOpen ? (
                            <FaChevronDown className="text-[9px] text-[#64748B]" />
                          ) : (
                            <FaChevronRight className="text-[9px] text-[#64748B]" />
                          )}
                          {g.label}
                        </span>
                        {activeGroupCount(g.id) > 0 && (
                          <span className="bg-[#2563EB1A] text-[#2563EB] text-[10px] font-bold rounded-full px-1.5 py-0.5">
                            {activeGroupCount(g.id)}
                          </span>
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-2">
                          {g.fields.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => addField(f.id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-[#F8FAFC] rounded transition"
                            >
                              <span className="w-4 h-4 rounded-[5px] border border-[#CBD5E1] bg-white flex items-center justify-center flex-shrink-0" />
                              <span className="text-xs text-slate-700 truncate">{f.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3.5 bg-white border-t border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => onNotify('Add custom field coming soon')}
            className="text-[#2563EB] hover:text-[#1D4ED8] text-xs font-semibold flex items-center gap-1 transition"
          >
            <FaPlus className="text-[10px]" />
            Add custom field
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#1E293B] text-xs font-semibold rounded-md transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApply(activeList);
                onClose();
              }}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-md shadow-sm transition"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageFieldsDrawer;
