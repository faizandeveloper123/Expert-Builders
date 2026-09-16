interface PaginationProps {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalItems: number;
  onPerPageChange: (n: number) => void;
  onPageChange: (p: number) => void;
}

const PER_PAGE_OPTIONS = [10, 50, 100];

function Pagination({
  currentPage,
  totalPages,
  perPage,
  totalItems,
  onPerPageChange,
  onPageChange,
}: PaginationProps) {
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);

  const btnClass = (disabled: boolean) =>
    disabled
      ? 'h-7 px-2.5 sm:px-3 border border-slate-200 rounded-md text-slate-400 text-[11px] font-medium cursor-not-allowed'
      : 'h-7 px-2.5 sm:px-3 border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 text-[11px] font-medium transition';

  return (
    <footer className="px-3 sm:px-6 py-1.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2 text-[11px] text-slate-500 flex-shrink-0">
      <div className="font-medium whitespace-nowrap">
        {start}–{end} of {totalItems}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <label className="flex items-center gap-1.5 text-slate-500">
          <span className="hidden sm:inline">Per page</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="h-7 border border-slate-200 rounded-md px-1.5 bg-white text-[11px] font-medium focus:outline-none focus:border-slate-400 cursor-pointer"
            aria-label="Items per page"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button disabled={isPrevDisabled} onClick={() => onPageChange(currentPage - 1)} className={btnClass(isPrevDisabled)}>
            Prev
          </button>
          <span className="h-7 px-2 flex items-center border border-blue-200 bg-blue-50 text-blue-700 rounded-md text-[11px] font-semibold whitespace-nowrap">
            {currentPage} / {totalPages}
          </span>
          <button disabled={isNextDisabled} onClick={() => onPageChange(currentPage + 1)} className={btnClass(isNextDisabled)}>
            Next
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Pagination;