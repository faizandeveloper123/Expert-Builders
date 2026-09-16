import { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  maxListHeight?: number;
}

/**
 * Generic searchable combobox. The single input doubles as the search field: it
 * shows the selected label when closed and becomes a type-ahead filter when open.
 * Clicking the field (or the caret) toggles the dropdown.
 */
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Type to search...',
  clearable = true,
  searchPlaceholder = 'Search...',
  className = '',
  maxListHeight = 240,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const openList = () => {
    setOpen(true);
    setQuery('');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const select = (opt: SelectOption) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      <div className="flex items-stretch">
        <FaMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (selected?.label ?? value)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!open) openList();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered.length > 0) {
              e.preventDefault();
              select(filtered[0]);
            }
          }}
          placeholder={open ? searchPlaceholder : placeholder}
          autoComplete="off"
          className="w-full pl-7 pr-9 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
          aria-haspopup="listbox"
          aria-expanded={open}
        />
        {clearable && value && !open && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear selection"
          >
            <FaXmark />
          </button>
        )}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (open ? setOpen(false) : openList())}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="Toggle dropdown"
        >
          <FaChevronDown className={`text-[9px] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 overflow-hidden"
        >
          <div className="overflow-y-auto" style={{ maxHeight: maxListHeight }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-[11px] text-slate-400">No options found</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(opt)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition truncate ${
                    opt.value === value ? 'text-blue-600 font-semibold bg-blue-50/60' : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;