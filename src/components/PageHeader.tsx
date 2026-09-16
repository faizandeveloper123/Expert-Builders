import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  FaArrowUpFromBracket,
  FaCopy,
  FaDownload,
  FaEllipsisVertical,
  FaGear,
  FaListCheck,
  FaPlus,
  FaRotate,
} from 'react-icons/fa6';

interface MenuAction {
  label: string;
  icon: IconType;
}

const menuActions: MenuAction[] = [
  { label: 'Export', icon: FaArrowUpFromBracket },
  { label: 'Restore', icon: FaRotate },
  { label: 'Manage smart lists', icon: FaListCheck },
  { label: 'Manage duplicates', icon: FaCopy },
  { label: 'Contact settings', icon: FaGear },
];

interface PageHeaderProps {
  totalCount: number;
  onOpenImport: () => void;
  onOpenAddContact: () => void;
  onExport: () => void;
  onNotify: (msg: string) => void;
  onManageSmartLists?: () => void;
  canAdd?: boolean;
  canImport?: boolean;
  canExport?: boolean;
}

function PageHeader({
  totalCount,
  onOpenImport,
  onOpenAddContact,
  onExport,
  onNotify,
  onManageSmartLists,
  canAdd = true,
  canImport = true,
  canExport = true,
}: PageHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleAction = (label: string) => {
    setMenuOpen(false);
    if (label === 'Export') {
      onExport();
    } else if (label === 'Manage smart lists') {
      onManageSmartLists?.();
    } else {
      onNotify(`Opened ${label}`);
    }
  };

  return (
    <div className="px-4 md:px-6 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 flex-shrink-0 gap-2">
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-bold text-slate-800">Contacts</h1>
        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
          {totalCount} Contacts
        </span>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        {canImport && (
          <button
            onClick={onOpenImport}
            className="flex-1 sm:flex-none justify-center h-8 px-3 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition"
          >
            <FaDownload className="text-slate-500" />
            <span>Import</span>
          </button>
        )}

        {canAdd && (
          <button
            onClick={onOpenAddContact}
            className="flex-1 sm:flex-none justify-center h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md flex items-center space-x-1.5 shadow-sm transition"
          >
            <FaPlus />
            <span>Add Contact</span>
          </button>
        )}

        <div className="relative inline-block text-left" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-8 h-8 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-md flex items-center justify-center text-xs transition"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <FaEllipsisVertical />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-xs"
            >
              {menuActions.map(({ label, icon: Icon }) => {
                if (label === 'Export' && !canExport) return null;
                return (
                  <button
                    key={label}
                    role="menuitem"
                    onClick={() => handleAction(label)}
                    className="flex items-center px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium transition w-full text-left"
                  >
                    <Icon className="w-4 mr-2.5 text-slate-500 text-xs" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
