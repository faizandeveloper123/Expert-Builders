import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaArrowsUpDown,
  FaBarsStaggered,
  FaCheck,
  FaFilter,
  FaGear,
  FaMagnifyingGlass,
  FaXmark,
} from 'react-icons/fa6';
import { SORT_OPTIONS } from '../data/smartListOptions';
import AnchoredPopover from './AnchoredPopover';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onManageFields: () => void;
  onOpenFilters: () => void;
  onSortChange: (sortBy: string) => void;
  filterCount: number;
  sortBy: string;
  onAddToList?: () => void;
}

function Toolbar({
  searchQuery,
  onSearchChange,
  selectedCount,
  onDeleteSelected,
  onManageFields,
  onOpenFilters,
  onSortChange,
  filterCount,
  sortBy,
  onAddToList,
}: ToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortQuery, setSortQuery] = useState('');
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sortOpen) searchRef.current?.focus();
  }, [sortOpen]);

  const closeSort = useCallback(() => {
    setSortOpen(false);
    setSortQuery('');
  }, []);

  const toggleSort = () => {
    setSortOpen((v) => !v);
  };

  const filteredSorts = sortQuery.trim()
    ? SORT_OPTIONS.filter((o) => o.toLowerCase().includes(sortQuery.trim().toLowerCase()))
    : SORT_OPTIONS;

  const pickSort = (s: string) => {
    onSortChange(s);
    closeSort();
  };

  return (
    <div className="px-4 md:px-6 py-1.5 flex items-center justify-between border-b border-slate-100 bg-white flex-shrink-0 gap-2">
      <div className="flex items-center space-x-2 overflow-x-auto pb-0.5 sm:pb-0 flex-shrink-0">
        <button
          onClick={onOpenFilters}
          className="h-8 px-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-medium flex items-center space-x-1.5 transition whitespace-nowrap flex-shrink-0"
        >
          <FaFilter className="text-slate-500" />
          <span>Filters</span>
          {filterCount > 0 && (
            <span className="bg-blue-600 text-white rounded-full px-1.5 text-[10px] font-bold leading-4">
              {filterCount}
            </span>
          )}
        </button>

        <button
          ref={sortBtnRef}
          onClick={toggleSort}
          className={`h-8 px-3 border border-slate-300 rounded-md text-xs font-medium flex items-center space-x-1.5 transition whitespace-nowrap flex-shrink-0 ${
            sortOpen || sortBy ? 'bg-blue-50 border-blue-300 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FaArrowsUpDown className={sortOpen || sortBy ? 'text-blue-600' : 'text-slate-500'} />
          <span>Sort</span>
          {sortBy && <span className="text-blue-600 text-[10px] font-semibold max-w-[110px] truncate">{sortBy}</span>}
          {sortBy && (
            <span
              role="button"
              title="Remove sort"
              onClick={(e) => {
                e.stopPropagation();
                pickSort('');
              }}
              className="flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition flex-shrink-0"
            >
              <FaXmark className="text-[9px]" />
            </span>
          )}
        </button>

        <AnchoredPopover
          open={sortOpen}
          anchorEl={sortBtnRef.current}
          onClose={closeSort}
          placement="bottom-start"
          width={256}
          className="animate-pop bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs"
        >
          <div className="px-2 py-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-md px-2 py-1.5 focus-within:border-blue-400 transition">
              <FaMagnifyingGlass className="text-slate-400 text-[10px] flex-shrink-0" />
              <input
                ref={searchRef}
                value={sortQuery}
                onChange={(e) => setSortQuery(e.target.value)}
                placeholder="Search sort fields..."
                className="w-full text-[11px] focus:outline-none"
              />
              {sortQuery && (
                <FaXmark
                  className="text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0"
                  onClick={() => setSortQuery('')}
                />
              )}
            </div>
          </div>

          <div className="max-h-[215px] overflow-y-auto py-0.5">
            {filteredSorts.length === 0 && <div className="px-3 py-2 text-slate-400">No matches</div>}
            {filteredSorts.map((o) => (
              <button
                key={o}
                onClick={() => pickSort(o)}
                className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between gap-2 transition ${
                  sortBy === o ? 'text-blue-600 font-semibold' : 'text-slate-700'
                }`}
              >
                <span className="truncate">{o}</span>
                {sortBy === o && <FaCheck className="text-blue-600 text-[10px] flex-shrink-0" />}
              </button>
            ))}
          </div>

          {sortBy && (
            <div className="border-t border-slate-100">
              <button
                onClick={() => pickSort('')}
                className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 font-medium transition"
              >
                Clear sort
              </button>
            </div>
          )}
        </AnchoredPopover>

        {selectedCount > 0 && (
          <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 h-8 rounded-md text-xs whitespace-nowrap flex-shrink-0">
            <span className="font-semibold">{selectedCount} selected</span>
            {onAddToList && (
              <button
                onClick={onAddToList}
                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium ml-2 transition"
              >
                <FaBarsStaggered className="text-[10px]" />
                Add to List
              </button>
            )}
            <button onClick={onDeleteSelected} className="text-red-600 hover:text-red-800 font-medium ml-2">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
        <div className="relative">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Contacts"
            className="w-36 sm:w-64 h-8 border border-slate-300 rounded-md pl-8 pr-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            aria-label="Search Contacts"
          />
        </div>

        <button
          onClick={onManageFields}
          className="h-8 px-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md text-xs font-medium flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0 transition"
        >
          <FaGear className="text-slate-500" />
          <span className="hidden sm:inline">Manage fields</span>
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
