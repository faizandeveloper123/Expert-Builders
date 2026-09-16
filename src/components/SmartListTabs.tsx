import { FaBarsStaggered, FaPlus, FaUserGear } from 'react-icons/fa6';
import type { SmartList } from './SmartListDrawer';

interface SmartListTabsProps {
  active: string;
  onSelect: (list: string) => void;
  customLists: SmartList[];
  onAdd: () => void;
  onRemove?: (id: string) => void;
  onRemoveBuiltIn?: (name: string) => void;
  hiddenBuiltIns?: string[];
}

const BUILT_INS = ['All'];

function SmartListTabs({ active, onSelect, customLists, onAdd, hiddenBuiltIns }: SmartListTabsProps) {
  const visibleBuiltIns = BUILT_INS.filter((list) => !hiddenBuiltIns?.includes(list));

  return (
    <div className="px-4 md:px-6 pt-1 pb-0 border-b border-slate-200 flex items-center space-x-4 text-xs font-medium text-slate-600 flex-shrink-0 overflow-x-auto whitespace-nowrap no-scrollbar">
      {visibleBuiltIns.map((list) => {
        const isActive = active === list;
        return (
          <button
            key={list}
            onClick={() => onSelect(list)}
            className={
              isActive
                ? 'flex items-center space-x-1.5 py-2 flex-shrink-0 text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'flex items-center space-x-1.5 py-2 flex-shrink-0 hover:text-slate-800'
            }
          >
            <FaBarsStaggered />
            <span>{list}</span>
          </button>
        );
      })}

      {customLists.map((list) => {
        const isActive = active === list.name;
        return (
          <div
            key={list.id}
            onClick={() => onSelect(list.name)}
            className={
              isActive
                ? 'flex items-center space-x-1.5 py-2 flex-shrink-0 text-blue-600 font-semibold border-b-2 border-blue-600 cursor-pointer'
                : 'flex items-center space-x-1.5 py-2 flex-shrink-0 hover:text-slate-800 cursor-pointer'
            }
          >
            <FaBarsStaggered />
            <span>{list.name}</span>
            {list.dealerName && (
              <span
                title={`Assigned to ${list.dealerName}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-semibold"
              >
                <FaUserGear className="text-[8px]" />
                {list.dealerName}
              </span>
            )}
          </div>
        );
      })}

      <button
        onClick={onAdd}
        className="my-1.5 h-6 flex items-center space-x-1 px-2.5 border border-slate-300 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex-shrink-0 transition"
      >
        <FaPlus className="text-[10px]" />
        <span>Add Smart List</span>
      </button>
    </div>
  );
}

export default SmartListTabs;
