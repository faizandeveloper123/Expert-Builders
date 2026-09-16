import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  FaBuilding,
  FaChevronDown,
  FaCodeMerge,
  FaCommentSms,
  FaEnvelope,
  FaFileExport,
  FaPeopleArrows,
  FaPlay,
  FaStar,
  FaTag,
  FaTags,
  FaTrash,
  FaWhatsapp,
} from 'react-icons/fa6';

export type BulkActionId =
  | 'export'
  | 'trigger-automation'
  | 'send-email'
  | 'add-tags'
  | 'delete'
  | 'send-sms'
  | 'send-whatsapp'
  | 'request-reviews'
  | 'manage-companies'
  | 'manage-opportunities'
  | 'remove-tags'
  | 'merge';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onAction: (action: BulkActionId) => void;
  canDelete?: boolean;
}

interface MenuItem {
  id: BulkActionId;
  label: string;
  icon: ReactNode;
  danger?: boolean;
}

function BulkActionsToolbar({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onAction,
}: BulkActionsToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const [moreMenuPos, setMoreMenuPos] = useState<{ top: number; right: number } | null>(null);

  const toggleMore = () => {
    if (moreOpen) {
      setMoreOpen(false);
      setMoreMenuPos(null);
      return;
    }
    const rect = moreBtnRef.current?.getBoundingClientRect();
    if (rect) setMoreMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setMoreOpen(true);
  };

  if (selectedCount === 0) return null;

  const primary: MenuItem[] = [
    { id: 'export', label: 'Export', icon: <FaFileExport className="text-slate-500" /> },
    { id: 'trigger-automation', label: 'Trigger automation', icon: <FaPlay className="text-slate-500" /> },
    { id: 'send-email', label: 'Send email', icon: <FaEnvelope className="text-slate-500" /> },
    { id: 'add-tags', label: 'Add tags', icon: <FaTags className="text-slate-500" /> },
    { id: 'delete', label: 'Delete', icon: <FaTrash className="text-red-500" />, danger: true },
  ];

  const groups: MenuItem[][] = [
    [
      { id: 'send-sms', label: 'Send SMS', icon: <FaCommentSms className="text-slate-400" /> },
      { id: 'send-email', label: 'Send email', icon: <FaEnvelope className="text-slate-400" /> },
      { id: 'send-whatsapp', label: 'Send WhatsApp', icon: <FaWhatsapp className="text-slate-400" /> },
      { id: 'request-reviews', label: 'Request reviews', icon: <FaStar className="text-slate-400" /> },
    ],
    [
      { id: 'manage-companies', label: 'Manage companies', icon: <FaBuilding className="text-slate-400" /> },
      { id: 'manage-opportunities', label: 'Manage opportunities', icon: <FaPeopleArrows className="text-slate-400" /> },
      { id: 'trigger-automation', label: 'Trigger automation', icon: <FaPlay className="text-slate-400" /> },
    ],
    [
      { id: 'add-tags', label: 'Add tags', icon: <FaTags className="text-slate-400" /> },
      { id: 'remove-tags', label: 'Remove tags', icon: <FaTag className="text-slate-400" /> },
    ],
    [
      { id: 'export', label: 'Export', icon: <FaFileExport className="text-slate-400" /> },
      { id: 'merge', label: 'Merge', icon: <FaCodeMerge className="text-slate-400" /> },
      { id: 'delete', label: 'Delete', icon: <FaTrash className="text-red-500" />, danger: true },
    ],
  ];

  const run = (id: BulkActionId) => {
    if (moreOpen) toggleMore();
    onAction(id);
  };

  return (
    <div className="evee-bulkbar flex items-center gap-2 px-4 md:px-6 py-1.5 border-b border-slate-200 bg-white flex-shrink-0 shadow-[0_6px_14px_-10px_rgba(15,23,42,0.25)]">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#f0f4ff] px-3 h-8 flex-shrink-0">
        <span className="inline-flex items-center rounded-full bg-white px-3 h-6 text-xs font-semibold text-blue-600 whitespace-nowrap">
          {allSelected ? 'All Contacts Selected' : `${selectedCount} Contact${selectedCount === 1 ? '' : 's'} Selected`}
        </span>

        <button
          onClick={onSelectAll}
          className="text-xs font-medium text-blue-600 hover:underline cursor-pointer whitespace-nowrap transition"
        >
          {allSelected ? `Unselect all ${totalCount}` : `Select all ${totalCount}`}
        </button>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {primary.map((btn) => (
          <button
            key={btn.id}
            onClick={() => run(btn.id)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0 transition ${
              btn.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex-shrink-0">{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}

        <div className="relative flex-shrink-0">
          <button
            ref={moreBtnRef}
            onClick={toggleMore}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-slate-700 transition ${
              moreOpen ? 'bg-slate-100' : 'hover:bg-slate-100'
            }`}
          >
            <span>More</span>
            <FaChevronDown
              className={`text-[10px] text-slate-500 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {moreOpen && moreMenuPos && (
            <>
              <div className="fixed inset-0 z-20" onClick={toggleMore} />
              <div
                className="animate-pop fixed z-30 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs max-h-[calc(100vh-24px)] overflow-y-auto"
                style={{ top: moreMenuPos.top, right: moreMenuPos.right }}
              >
                {groups.map((group, gi) => (
                  <div key={gi}>
                    {gi > 0 && <div className="my-1 border-t border-slate-100" />}
                    {group.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => run(item.id)}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition ${
                          item.danger ? 'text-red-600 font-medium' : 'text-slate-700'
                        }`}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkActionsToolbar;
