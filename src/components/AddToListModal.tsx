import { useMemo, useState } from 'react';
import { FaBarsStaggered, FaCheck, FaMagnifyingGlass, FaPlus, FaXmark } from 'react-icons/fa6';
import type { SmartList } from './SmartListDrawer';

interface AddToListModalProps {
  open: boolean;
  lists: SmartList[];
  selectedCount: number;
  onClose: () => void;
  onSelect: (list: SmartList) => void;
  onCreate: () => void;
}

function AddToListModal({ open, lists, selectedCount, onClose, onSelect, onCreate }: AddToListModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((l) => l.name.toLowerCase().includes(q));
  }, [lists, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[60]">
      <div className="bg-white w-[420px] max-w-[94vw] max-h-[80vh] rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FaBarsStaggered className="text-blue-600" />
              Add to Smart List
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedCount} contact{selectedCount === 1 ? '' : 's'} selected — choose a list to add them to
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <FaXmark className="text-lg" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search smart lists"
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              {query ? 'No smart lists match your search' : 'No smart lists yet'}
            </p>
          ) : (
            filtered.map((list) => (
              <button
                key={list.id}
                onClick={() => onSelect(list)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-50 transition group"
              >
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <FaBarsStaggered className="text-xs" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-slate-800 truncate">{list.name}</span>
                  <span className="block text-[10px] text-slate-400">
                    {(list.members ?? []).length} contact{(list.members ?? []).length === 1 ? '' : 's'}
                  </span>
                </span>
                <FaCheck className="text-blue-600 opacity-0 group-hover:opacity-100 text-xs" />
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-md transition"
          >
            <FaPlus className="text-[10px]" />
            New Smart List
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddToListModal;