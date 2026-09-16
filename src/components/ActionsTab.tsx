import { useState } from 'react';
import { FaArrowUpRightFromSquare, FaChevronDown, FaPlus } from 'react-icons/fa6';

interface ActionsTabProps {
  createdBy: string;
  createdOn: string;
  onCreateOpportunity: () => void;
  onLinkExisting: () => void;
  onAuditLogsClick: () => void;
  onNotify: (msg: string) => void;
}

const accordionCls = 'border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm';
const headerBtnCls =
  'w-full px-3 py-2 flex items-center justify-between cursor-pointer font-semibold hover:bg-slate-50 transition';
const titleCls = 'text-[14px] font-bold text-[#1E293B]';
const selectInputCls =
  'w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-700 placeholder-slate-400 cursor-pointer focus:outline-none focus:border-blue-500';

function ActionsTab({
  createdBy,
  createdOn,
  onCreateOpportunity,
  onLinkExisting,
  onAuditLogsClick,
  onNotify,
}: ActionsTabProps) {
  const [isOpportunitiesOpen, setIsOpportunitiesOpen] = useState(true);
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(true);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(true);

  const chevron = (open: boolean) => (
    <FaChevronDown
      className={`text-[10px] text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    />
  );

  return (
    <div className="space-y-3 mt-3">
      <div className={accordionCls}>
        <button onClick={() => setIsOpportunitiesOpen((v) => !v)} className={headerBtnCls}>
          <span className={titleCls}>Opportunities</span>
          <span className="flex items-center space-x-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                onCreateOpportunity();
              }}
              className="text-slate-500 hover:text-blue-600 font-semibold"
            >
              + Add
            </span>
            {chevron(isOpportunitiesOpen)}
          </span>
        </button>
        {isOpportunitiesOpen && (
          <div className="p-4 text-center space-y-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">No Opportunity Found</p>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                onClick={onCreateOpportunity}
                className="px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Create new
              </button>
              <button
                onClick={onLinkExisting}
                className="px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] rounded text-xs font-semibold hover:bg-blue-100 transition"
              >
                Link existing
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={accordionCls}>
        <button onClick={() => setIsWorkflowsOpen((v) => !v)} className={headerBtnCls}>
          <span className={titleCls}>Workflows</span>
          {chevron(isWorkflowsOpen)}
        </button>
        {isWorkflowsOpen && (
          <div className="p-3 space-y-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Active workflows</span>
              <button
                onClick={() => onNotify('Add active workflow')}
                title="Add workflow"
                className="w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center hover:bg-blue-600 transition flex-shrink-0"
              >
                <FaPlus className="text-[10px]" />
              </button>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-700">Past workflows</span>
              <p className="text-xs text-[#64748B] mt-0.5">No past workflows</p>
            </div>
          </div>
        )}
      </div>

      <div className={accordionCls}>
        <button onClick={() => setIsClientPortalOpen((v) => !v)} className={headerBtnCls}>
          <span className={titleCls}>Client portal</span>
          {chevron(isClientPortalOpen)}
        </button>
        {isClientPortalOpen && (
          <div className="p-3 space-y-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Offers</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and manage offers"
                  readOnly
                  onClick={() => onNotify('Searching and managing offers')}
                  className={`${selectInputCls} pr-7`}
                />
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Community groups</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and manage groups"
                  readOnly
                  onClick={() => onNotify('Searching and managing groups')}
                  className={`${selectInputCls} pr-7`}
                />
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-gray-200 space-y-1">
        <p className="text-[11px] text-slate-400">
          Created by:{' '}
          <button onClick={() => onNotify(`Opened form for ${createdBy}`)} className="text-[#2563EB] font-medium">
            {createdBy}
          </button>
        </p>
        <p className="text-[11px] text-[#64748B]">Created on: {createdOn}</p>
        <button
          onClick={onAuditLogsClick}
          className="w-full mt-2 flex items-center justify-center gap-1.5 border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <FaArrowUpRightFromSquare className="text-[10px]" />
          Audit logs
        </button>
      </div>
    </div>
  );
}

export default ActionsTab;
