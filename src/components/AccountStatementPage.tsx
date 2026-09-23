import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  FaBookOpen,
  FaFilePdf,
  FaFloppyDisk,
  FaPlus,
  FaPrint,
  FaRegTrashCan,
  FaRotateRight,
  FaListOl,
} from 'react-icons/fa6';
import { api, type ApiAccountStatement, type ApiReceipt, type ApiStatementRow, type StatementRowInput } from '../api';
import { useAuth } from '../auth';
import BrandLogo from './BrandLogo';

/* ------------------------------ helpers ------------------------------ */

function fmtMoney(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  const n = Math.round(amount);
  return n.toLocaleString('en-PK');
}

function parseNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const cleaned = String(v).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function todayDMY(offsetMonths = 0, day = 1): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  d.setDate(Math.min(day, 28));
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

type Html2PdfApi = {
  (): {
    set: (opt: Record<string, unknown>) => {
      from: (el: HTMLElement) => { save: () => Promise<void> };
    };
  };
};
function getHtml2Pdf(): Html2PdfApi | null {
  const w = window as unknown as { html2pdf?: Html2PdfApi };
  return w.html2pdf ?? null;
}
function loadHtml2Pdf(): Promise<Html2PdfApi> {
  return new Promise((resolve, reject) => {
    const existing = getHtml2Pdf();
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    script.onload = () => {
      const lib = getHtml2Pdf();
      if (lib) resolve(lib);
      else reject(new Error('PDF library failed to initialise'));
    };
    script.onerror = () =>
      reject(new Error('Could not load the PDF library (check your internet connection)'));
    document.head.appendChild(script);
  });
}

/** Excel sheet palette (matches account_statement_sheet_pdf_generator.html). */
const XLS = {
  header: '#0a529c', // statement.blue (leading band / column title)
  headerDeep: '#004b93', // statement.headerBlue
  rowFillA: '#eef5fc', // statement.lightBlue (alternating ledger rows)
  rowFillB: '#f7fbfe', // lighter fill for the alternate half
  rule: '#a3c7e8', // statement.borderBlue (soft gridlines)
  dark: '#0a3866', // statement.darkText
};

/* ---------------------- local draft row representation ---------------- */

interface DraftRow {
  rowId: number | null;
  seq: number;
  description: string;
  instNo: string;
  dueDate: string;
  dueAmount: string;
  paidAmount: string;
  paidDate: string;
  outstanding: number;
}

function rowToDraft(r: ApiStatementRow): DraftRow {
  return {
    rowId: r.id,
    seq: r.seq,
    description: r.description,
    instNo: r.inst_no,
    dueDate: r.due_date,
    dueAmount: String(r.due_amount),
    paidAmount: String(r.paid_amount),
    paidDate: r.paid_date,
    outstanding: r.outstanding,
  };
}

function draftToRow(d: DraftRow): { input: StatementRowInput; rowId: number | null } {
  return {
    rowId: d.rowId,
    input: {
      seq: d.seq,
      description: d.description,
      inst_no: d.instNo,
      due_date: d.dueDate,
      due_amount: parseNum(d.dueAmount),
    },
  };
}

/* ================================ page ============================== */

interface AccountStatementPageProps {
  onNotify: (msg: string) => void;
}

const MEMBER_FIELDS: { key: keyof ApiAccountStatement; label: string }[] = [
  { key: 'registration_no', label: 'Registration No' },
  { key: 'booking_date', label: 'Booking Date' },
  { key: 'member_name', label: 'Member Name' },
  { key: 'file_no', label: 'File #' },
  { key: 'so', label: 'S/O' },
  { key: 'plot_size', label: 'Plot Size' },
  { key: 'cnic', label: 'CNIC' },
  { key: 'file_type', label: 'File Type' },
  { key: 'address', label: 'Address' },
  { key: 'block', label: 'Block' },
  { key: 'phone_no', label: 'Phone No' },
  { key: 'street', label: 'Street' },
  { key: 'file_status', label: 'File Status' },
];

const MEMBER_LABEL: Record<string, string> = Object.fromEntries(
  MEMBER_FIELDS.map((f) => [f.key, f.label])
);

/** Excel rows 7..13 laid out as left/right label+value pairs. */
const FIELDS_PAIRS: [keyof ApiAccountStatement | null, keyof ApiAccountStatement | null][] = [
  ['registration_no', 'booking_date'],
  ['member_name', 'file_no'],
  ['so', 'plot_size'],
  ['cnic', 'file_type'],
  ['address', 'block'],
  ['phone_no', 'street'],
  [null, 'file_status'],
];

export default function AccountStatementPage({ onNotify }: AccountStatementPageProps) {
  const { user, hasActionPermission } = useAuth();
  const canEdit = hasActionPermission('invoices', 'Invoices', 'edit');
  const canDelete = hasActionPermission('invoices', 'Invoices', 'delete');

  const [statements, setStatements] = useState<ApiAccountStatement[]>([]);
  const [active, setActive] = useState<ApiAccountStatement | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFile, setNewFile] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [receiptMembers, setReceiptMembers] = useState<ApiReceipt[]>([]);
  const [saving, setSaving] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);

  const sheetRef = useRef<HTMLDivElement | null>(null);

  /* The page is only shown when a statement is open; print just the sheet. */
  useEffect(() => {
    document.body.classList.add('as-printing');
    return () => document.body.classList.remove('as-printing');
  }, []);

  /** Load the statement picker list. */
  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const params: { created_by?: number } = {};
      if (user && user.user_type !== 'Admin') params.created_by = user.id;
      const res = await api.listAccountStatements(params);
      setStatements(res.data);
      if (res.data.length > 0) {
        setActive((prev) => (prev && res.data.some((s) => s.id === prev.id) ? prev : null));
      }
    } catch (err) {
      onNotify(`Failed to load statements: ${(err as Error).message}`);
    } finally {
      setLoadingList(false);
    }
  }, [user, onNotify]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openStatement = useCallback(
    async (id: number) => {
      setLoadingDetail(true);
      try {
        const res = await api.getAccountStatement(id);
        setActive(res.data);
        setDraftRows(res.data.rows.map(rowToDraft));
      } catch (err) {
        onNotify(`Failed to open statement: ${(err as Error).message}`);
      } finally {
        setLoadingDetail(false);
      }
    },
    [onNotify]
  );

  /* ------------------------- derived numbers -------------------------- */

  const receivedAmount = useMemo(
    () => draftRows.reduce((s, r) => s + parseNum(r.paidAmount), 0),
    [draftRows]
  );
  const costOfLand = active ? parseNum(active.cost_of_land) : 0;
  const balanceAmount = Math.max(0, costOfLand - receivedAmount);
  const progress =
    costOfLand > 0 ? Math.min(100, Math.max(0, Math.round((receivedAmount / costOfLand) * 100))) : 0;

  /* ----------------------------- actions ------------------------------ */

  const handleNew = async () => {
    if (!newName.trim()) {
      onNotify('Enter a member name to create the account statement');
      return;
    }
    setCreating(true);
    try {
      const res = await api.createAccountStatement({
        member_name: newName.trim(),
        file_no: newFile.trim() || undefined,
        created_by: user?.id ?? null,
      });
      setNewName('');
      setNewFile('');
      setShowCreate(false);
      await loadList();
      onNotify(`Account statement created for "${res.data.member_name}"`);
      void openStatement(res.data.id);
    } catch (err) {
      onNotify(`Create failed: ${(err as Error).message}`);
    } finally {
      setCreating(false);
    }
  };

  /** Pull members straight from the saved Receipt Vouchers (auto-fetch). */
  const loadReceiptMembers = async () => {
    setImporting(true);
    try {
      const res = await api.listReceipts({});
      setReceiptMembers(res.data);
    } catch (err) {
      onNotify(`Could not load receipt members: ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  /** Names that already have a statement (case-insensitive). */
  const existingNames = useMemo(
    () => new Set(statements.map((s) => s.member_name.trim().toLowerCase())),
    [statements]
  );

  /** Distinct receipt customers who don't yet have a statement. */
  const pendingReceiptMembers = useMemo(() => {
    const seen = new Map<string, ApiReceipt>();
    for (const r of receiptMembers) {
      const name = (r.received_from ?? '').trim();
      if (!name) continue;
      if (existingNames.has(name.toLowerCase())) continue;
      const key = name.toLowerCase();
      const cur = seen.get(key);
      if (!cur || (cur.receipt_no ?? '') < (r.receipt_no ?? '')) seen.set(key, r);
    }
    return Array.from(seen.values());
  }, [receiptMembers, existingNames]);

  /** Prefill the create form from a receipt + optionally create immediately. */
  const handleImportFromReceipt = async (r: ApiReceipt) => {
    const name = (r.received_from ?? '').trim();
    if (!name) return;
    setNewName(name);
    setNewFile((r.reg_no ?? '').trim() || '');
    await handleNew();
  };

  const handleSave = async () => {
    if (!active || !canEdit || saving) return;
    setSaving(true);
    try {
      const memberPayload: Record<string, string | number | null> = {
        registration_no: active.registration_no,
        booking_date: active.booking_date,
        member_name: active.member_name,
        file_no: active.file_no,
        so: active.so,
        plot_size: active.plot_size,
        cnic: active.cnic,
        file_type: active.file_type,
        address: active.address,
        block: active.block,
        phone_no: active.phone_no,
        street: active.street,
        file_status: active.file_status,
        cost_of_land: costOfLand,
        remarks: active.remarks,
      };
      await api.updateAccountStatement(active.id, memberPayload);

      for (const d of draftRows) {
        const { rowId, input } = draftToRow(d);
        if (rowId !== null) {
          await api.updateStatementRow(active.id, rowId, input);
        }
      }
      onNotify(`Statement "${active.member_name}" saved — paid columns stay in sync with receipts`);
      const res = await api.getAccountStatement(active.id);
      setActive(res.data);
      setDraftRows(res.data.rows.map(rowToDraft));
    } catch (err) {
      onNotify(`Save failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!active || !canEdit) return;
    if (
      !window.confirm(
        'Generate the standard 31-row schedule (Booking/Advance + 30 installments, half-yearly every 6th)?'
      )
    )
      return;
    try {
      const res = await api.generateStatementSchedule(active.id);
      setActive(res.data);
      setDraftRows(res.data.rows.map(rowToDraft));
      onNotify('31-row payment schedule generated');
    } catch (err) {
      onNotify(`Schedule failed: ${(err as Error).message}`);
    }
  };

  const handleDelete = async () => {
    if (!active || !canDelete) return;
    if (!window.confirm(`Delete the account statement for "${active.member_name}"?`)) return;
    try {
      await api.deleteAccountStatement(active.id);
      setActive(null);
      onNotify('Account statement deleted');
      await loadList();
    } catch (err) {
      onNotify(`Delete failed: ${(err as Error).message}`);
    }
  };

  const handleRefresh = async () => {
    if (active) await openStatement(active.id);
    await loadList();
    if (active) onNotify('Statement refreshed from the database');
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!sheetRef.current || pdfBusy) return;
    setPdfBusy(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      await html2pdf()
        .set({
          margin: [0.25, 0.2, 0.25, 0.2],
          filename: `Account_Statement_${(active?.member_name || 'member').replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
        })
        .from(sheetRef.current)
        .save();
    } catch (err) {
      onNotify(`${(err as Error).message} - opening the print dialog instead`);
      window.print();
    } finally {
      setPdfBusy(false);
    }
  };

  /* --------------------------- draft editing -------------------------- */

  const patchMember =
    (key: keyof ApiAccountStatement) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!active) return;
      if (key === 'cost_of_land') {
        setActive({ ...active, cost_of_land: parseNum(e.target.value) });
        return;
      }
      const v = e.target.value;
      setActive({ ...active, [key]: (v as never) });
    };

  const patchRow = (index: number, patch: Partial<DraftRow>) => {
    setDraftRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setDraftRows((prev) => {
      const nextSeq = prev.length ? Math.max(...prev.map((r) => r.seq)) + 1 : 1;
      return [...prev, emptyDraft(nextSeq)];
    });
  };

  const removeRow = (index: number) => {
    setDraftRows((prev) => prev.filter((_, i) => i !== index));
  };

  /* ------------------------------- UI --------------------------------- */

  const cellInput = (cls = '') =>
    `w-full min-w-0 bg-transparent px-1.5 py-1 text-[11px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0B5EA8]/40 rounded font-semibold text-[#1F2937] placeholder:text-slate-400 ${cls}`;

  /* One labeled editable cell of the member info grid (Excel rows 7..13). */
  function FieldCell({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  }) {
    return (
      <>
        <div
          className="px-2 py-1.5 shrink-0 text-[10px] font-extrabold uppercase tracking-wide flex items-center overflow-hidden"
          style={{
            backgroundColor: XLS.rowFillA,
            color: '#1F2937',
            borderRight: `1px solid ${XLS.rule}`,
            width: 128,
            maxWidth: '38%',
            minWidth: 72,
          }}
        >
          <span className="truncate">{label}</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="—"
          className={`${cellInput('flex-1 min-w-0')} overflow-hidden`}
        />
      </>
    );
  }

  return (
    <>
      <style>{`
        .as-sel { border-bottom: 1.5px dotted #94a8bd; }
        .as-sel:focus { border-bottom: 1.5px solid #0B5EA8; outline: none; }
        @media print {
          body.as-printing * { visibility: hidden !important; }
          body.as-printing .as-sheet, body.as-printing .as-sheet * { visibility: visible !important; }
          body.as-printing .as-scroll-host { overflow: visible !important; }
          body.as-printing .as-sheet { position: absolute; left: 0; top: 0; width: 100% !important; min-width: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
          body.as-printing input { border: none !important; box-shadow: none !important; background: rgba(255,255,255,0) !important; }
        }
      `}</style>

      <div className="h-full overflow-y-auto bg-slate-100 min-w-0">
        <div className="max-w-[1500px] mx-auto px-3 md:px-6 pb-8">
          {/* Heading + toolbar */}
          <div className="sticky top-0 z-30 -mx-3 md:-mx-6 px-3 md:px-6 pt-4 pb-3 mb-5 bg-slate-100/85 backdrop-blur-md border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#0B5EA8] flex items-center justify-center shadow-md ring-1 ring-black/10">
                <BrandLogo wordmark={false} chip={false} className="h-[62%] w-auto" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Account Statement
                </h1>
                <p className="text-xs text-slate-500">
                  Editable land / payment ledger — paid columns update automatically from Receipt
                  Vouchers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={active ? active.id : ''}
                onChange={(e) => e.target.value && void openStatement(Number(e.target.value))}
                className="h-9 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 px-2.5 min-w-[190px] focus:border-brand-blue focus:outline-none"
                disabled={loadingList}
              >
                <option value="">{loadingList ? 'Loading...' : 'Select a statement...'}</option>
                {statements.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.member_name}
                    {s.registration_no ? ` · ${s.registration_no}` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setShowCreate((v) => !v);
                  if (!showCreate) void loadReceiptMembers();
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-brand-blue hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm shadow-brand-blue/40 transition active:scale-[0.98]"
              >
                <FaPlus className="text-[10px]" /> New Member
              </button>

              {active && (
                <>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center justify-center w-9 h-9 bg-white border border-slate-300 text-slate-600 hover:text-brand-blue hover:border-brand-blue/50 rounded-lg transition"
                    title="Refresh from database"
                  >
                    <FaRotateRight />
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 h-9 px-4 bg-brand-blue hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm shadow-brand-blue/40 transition active:scale-[0.98] disabled:opacity-50"
                    >
                      <FaFloppyDisk className={saving ? 'animate-pulse' : ''} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white border border-slate-300 text-slate-700 hover:border-slate-400 rounded-lg text-xs font-bold shadow-sm transition active:scale-[0.98]"
                  >
                    <FaPrint /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdf()}
                    disabled={pdfBusy}
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <FaFilePdf className="text-brand-blue" />
                    {pdfBusy ? 'Preparing...' : 'PDF'}
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="inline-flex items-center justify-center w-9 h-9 bg-white border border-slate-300 text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 rounded-lg transition"
                      title="Delete statement"
                    >
                      <FaRegTrashCan />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* New member quick-create */}
          {showCreate && (
            <>
              <div className="mb-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                Member Name *
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Abdul Raheem Khan"
                  className="w-64 p-2 border border-slate-300 rounded-lg text-xs font-semibold focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                File # / Reg No
                <input
                  type="text"
                  value={newFile}
                  onChange={(e) => setNewFile(e.target.value)}
                  placeholder="e.g. 1487 or RDC-1487"
                  className="w-48 p-2 border border-slate-300 rounded-lg text-xs font-semibold focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleNew()}
                disabled={creating}
                className="h-9 px-4 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Statement'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-9 px-3 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            {/* Import members straight from Recеipt Vouchers */}
            <div className="mb-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaListOl className="text-[#0a529c]" /> Import from Receipt Vouchers
                </h3>
                {importing && (
                  <span className="text-[10px] text-slate-400 animate-pulse">Loading receipts...</span>
                )}
              </div>
              {pendingReceiptMembers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {importing
                    ? 'Fetching receipt members…'
                    : 'No receipt customers are waiting. Members already have statements, or no receipts have been saved yet.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {pendingReceiptMembers.slice(0, 12).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 hover:bg-white transition"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {(r.received_from ?? '').trim()}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {(r.reg_no || 'no reg').trim()} · {fmtMoney(r.amount ?? 0)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleImportFromReceipt(r)}
                        disabled={creating}
                        className="shrink-0 h-7 px-3 rounded-md bg-[#0a529c] hover:bg-[#004b93] text-white text-[10px] font-bold transition disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
          )}

          <div className="space-y-4">
            {!active ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0B5EA8]/10 text-[#0B5EA8] flex items-center justify-center mb-4">
                  <FaBookOpen className="text-3xl" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No account statement open</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
                  Select a member from the dropdown above, or create a new statement with the
                  <span className="font-bold text-slate-600"> New Member </span> button.
                </p>
                {loadingList && (
                  <p className="text-xs text-slate-400 mt-3 animate-pulse">Loading statements...</p>
                )}
              </div>
            ) : loadingDetail ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center py-24 text-slate-400 text-sm">
                Opening statement...
              </div>
            ) : (
              <>{active && <SheetView />}</>
            )}
          </div>
        </div>
      </div>
    </>
  );

  /* -------- the actual Excel-style sheet (kept inside the component scope) -------- */
  function SheetView() {
    if (!active) return null;

    const totalDue = draftRows.reduce((s, r) => s + parseNum(r.dueAmount), 0);

    return (
      <div className="as-scroll-host overflow-x-auto pb-6">
        <div
          ref={sheetRef}
          className="as-sheet bg-white shadow-xl shadow-slate-900/10 rounded-xl ring-1 ring-slate-200 text-[#1F2937] w-full min-w-[1180px] overflow-hidden"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
        >
          {/* ===== Header block — Excel rows 1..5 ===== */}
          <div className="pt-4 pb-0 text-center" style={{ paddingLeft: 28, paddingRight: 28 }}>
            <h1
              className="font-black uppercase tracking-wide leading-tight text-lg md:text-xl"
              style={{ color: '#1F2937', fontSize: '14pt' }}
            >
              Expert Marketing And Developer&apos;s
            </h1>
            <p className="mt-0.5 text-[10px] text-slate-600 font-medium leading-snug">
              Abdul Majeed Plaza, Main Chakri Road, Peer Mehar Ali Shah Town, Near Royal Grand
              Marquee, Rawalpindi.
            </p>
            <p className="text-[10px] text-slate-700 font-bold mt-0.5">
              Mobile # 0300-5551350&nbsp;&nbsp;|&nbsp;&nbsp;Ph: 051-5575280&nbsp;&nbsp;|&nbsp;&nbsp;Email:{' '}
              expertbuilders39@gmail.com
            </p>
          </div>

          {/* ACCOUNT STATEMENT band */}
          <div
            className="mt-3 text-center uppercase tracking-[0.25em]"
            style={{ backgroundColor: XLS.header, color: '#fff', fontSize: '17pt', fontWeight: 900, padding: '4px 0', fontFamily: "'Segoe UI', Arial, sans-serif" }}
          >
            Account Statement
          </div>

          <div className="p-5 pt-4">
            {/* ===== Member info grid — Excel rows 7..13 ===== */}
            <div
              className="grid grid-cols-2 gap-px mb-4"
              style={{ backgroundColor: XLS.rule, border: `1px solid ${XLS.rule}` }}
            >
              {FIELDS_PAIRS.map(([leftKey, rightKey], rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex items-stretch bg-white"
                  style={
                    leftKey === null || rowIdx === FIELDS_PAIRS.length - 1
                      ? { gridColumn: 'span 2' }
                      : undefined
                  }
                >
                  {leftKey === null ? null : (
                    <FieldCell
                      label={MEMBER_LABEL[leftKey as string]}
                      value={String(active?.[leftKey] ?? '')}
                      onChange={patchMember(leftKey)}
                    />
                  )}
                  {rightKey === null ? null : (
                    <FieldCell
                      label={MEMBER_LABEL[rightKey as string]}
                      value={String(active?.[rightKey] ?? '')}
                      onChange={patchMember(rightKey)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* ===== Summary boxes — Excel rows 15..16 ===== */}
            <div
              className="grid grid-cols-3 gap-px mb-4"
              style={{ backgroundColor: XLS.rule, border: `1px solid ${XLS.rule}` }}
            >
              {/* Cost of Land (A15:C16) */}
              <div className="bg-white px-3 py-2.5" style={{ backgroundColor: XLS.rowFillB, border: '1px solid #fff' }}>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#1F2937] leading-tight">
                  Cost of Land:
                </div>
                <div className="text-[15px] font-black text-[#0B5EA8] leading-tight mt-1">
                  Rs. {fmtMoney(costOfLand)}/-
                </div>
                <div className="text-[8px] text-slate-500 font-semibold mt-0.5">
                  (Exclusive of Development Charges)
                </div>
                <input
                  type="number"
                  value={active.cost_of_land ? String(active.cost_of_land) : ''}
                  onChange={patchMember('cost_of_land')}
                  placeholder="0"
                  title="Edit total property value"
                  className="w-full bg-white/70 border border-dashed border-[#0B5EA8]/50 rounded px-1.5 py-0.5 text-[10px] text-right font-black text-[#0B5EA8] focus:outline-none focus:ring-1 focus:ring-[#0B5EA8] mt-1.5"
                />
              </div>
              {/* Received Amount (D15:F16) */}
              <div className="bg-white px-3 py-2.5" style={{ backgroundColor: XLS.rowFillB, border: '1px solid #fff' }}>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#1F2937] leading-tight">
                  Received Amount:
                </div>
                <div className="text-[15px] font-black text-[#0B5EA8] leading-tight mt-1">
                  Rs. {fmtMoney(receivedAmount)}/-
                </div>
                <div className="text-[8px] text-slate-500 font-semibold mt-0.5">
                  Auto total of paid ledger
                </div>
              </div>
              {/* Balance Amount (G15:H16) */}
              <div className="bg-white px-3 py-2.5" style={{ backgroundColor: XLS.rowFillB, border: '1px solid #fff' }}>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#1F2937] leading-tight">
                  Balance Amount:
                </div>
                <div
                  className={`text-[15px] font-black leading-tight mt-1 ${
                    balanceAmount > 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  Rs. {fmtMoney(balanceAmount)}/-
                </div>
                <div className="text-[8px] text-slate-500 font-semibold mt-0.5">
                  {progress.toFixed(2)}% payment progress
                </div>
              </div>
            </div>

            {/* ===== Ledger table — Excel rows 18..50 ===== */}
            <div
              className="overflow-hidden rounded-lg"
              style={{ border: `1px solid ${XLS.header}` }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: XLS.header }}>
                    {['#', 'Description', 'Inst No', 'Due Date', 'Due Amount', 'Paid Amount', 'Paid Date', 'Out Standing'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`text-[10px] uppercase tracking-wider text-white font-extrabold py-2 px-2 border border-white/15 ${
                            i > 4 ? 'text-right' : ''
                          } ${i === 1 ? 'min-w-[150px]' : ''} ${i === 0 ? 'w-8' : ''}`}
                        >
                          {h}
                        </th>
                      )
                    )}
                    {canEdit && <th className="w-8 border border-white/15" />}
                  </tr>
                </thead>
                <tbody>
                  {draftRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canEdit ? 9 : 8}
                        className="text-center py-10 text-slate-400 text-xs"
                        style={{ backgroundColor: XLS.rowFillB }}
                      >
                        No payment rows yet. Click{' '}
                        <span className="font-bold text-[#0B5EA8]">Generate 31-Row Schedule</span>{' '}
                        to build the standard installment plan, or add rows manually.
                      </td>
                    </tr>
                  ) : (
                    draftRows.map((r, i) => {
                      const paid = parseNum(r.paidAmount);
                      const due = parseNum(r.dueAmount);
                      const outstanding = Math.max(0, due - paid);
                      const autoPaid = r.rowId !== null;
                      return (
                        <tr
                          key={r.rowId ?? `new-${i}`}
                          className="border-b border-white"
                          style={{
                            backgroundColor: i % 2 === 0 ? XLS.rowFillA : XLS.rowFillB,
                            borderColor: XLS.rule,
                          }}
                        >
                          <td className="px-2 py-1 text-[11px] font-black text-slate-500 w-8 font-mono">
                            {r.seq}
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              value={r.description}
                              onChange={(e) => patchRow(i, { description: e.target.value })}
                              placeholder="Installment 1 of 30"
                              className={cellInput()}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              value={r.instNo}
                              onChange={(e) => patchRow(i, { instNo: e.target.value })}
                              placeholder="Inst-01"
                              className={cellInput()}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              value={r.dueDate}
                              onChange={(e) => patchRow(i, { dueDate: e.target.value })}
                              placeholder="DD/MM/YYYY"
                              className={cellInput()}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={r.dueAmount}
                              onChange={(e) => patchRow(i, { dueAmount: e.target.value })}
                              placeholder="0"
                              className={`${cellInput('text-right')} font-black`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={r.paidAmount}
                              onChange={(e) => patchRow(i, { paidAmount: e.target.value })}
                              placeholder="0"
                              className={`${cellInput('text-right')} font-black ${
                                autoPaid ? 'bg-white/50' : ''
                              }`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              value={r.paidDate}
                              onChange={(e) => patchRow(i, { paidDate: e.target.value })}
                              placeholder="DD/MM/YYYY"
                              className={cellInput()}
                            />
                          </td>
                          <td
                            className={`px-2 py-1 text-right text-[11px] font-black ${
                              outstanding > 0 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            Rs {fmtMoney(outstanding)}
                          </td>
                          {canEdit && (
                            <td className="px-1 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(i)}
                                className="text-slate-300 hover:text-red-600 transition p-1 rounded"
                                title="Remove row"
                              >
                                <FaRegTrashCan className="text-[11px]" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  {/* Totals row — Excel row 50 */}
                  <tr style={{ backgroundColor: XLS.rowFillA }}>
                    <td colSpan={4} className="py-2 px-2 text-right text-[10px] uppercase tracking-wider text-[#1F2937] font-extrabold">
                      Totals
                    </td>
                    <td className="py-2 px-2 text-right text-[11px] text-[#1F2937] font-black">
                      Rs {fmtMoney(totalDue)}
                    </td>
                    <td className="py-2 px-2 text-right text-[11px] text-[#0B5EA8] font-black">
                      Rs {fmtMoney(receivedAmount)}
                    </td>
                    <td className="py-2 px-2" />
                    <td className="py-2 px-2 text-right text-[11px] text-red-600 font-black">
                      Rs {fmtMoney(balanceAmount)}
                    </td>
                    {canEdit && <td className="py-2 px-2" />}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ===== Remarks + Final Summary — Excel rows 52..55 ===== */}
            <div
              className="mt-4 grid grid-cols-2 gap-px"
              style={{ backgroundColor: XLS.rule, border: `1px solid ${XLS.rule}` }}
            >
              {/* Remarks (A52:D55) */}
              <div className="p-3" style={{ backgroundColor: XLS.rowFillB }}>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#1F2937]">
                  Remarks:
                </div>
                <textarea
                  rows={4}
                  value={active.remarks}
                  onChange={patchMember('remarks')}
                  placeholder="Notes about this member's account..."
                  className="w-full bg-white/60 border border-dashed border-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#0B5EA8] focus:bg-white resize-none font-semibold text-slate-700 placeholder:text-slate-400"
                />
                <div className="mt-1 text-[10px] font-bold text-slate-600 leading-relaxed">
                  <div>
                    Payment Progress:{' '}
                    <span className="text-[#0B5EA8]">{progress.toFixed(2)}%</span>
                  </div>
                  <div className={balanceAmount > 0 ? 'text-red-600' : 'text-emerald-700'}>
                    {balanceAmount > 0 ? '\u25CF Payment Pending' : '\u25CF Fully Paid'}
                  </div>
                </div>
              </div>

              {/* Final Summary (E52:H55) */}
              <div className="p-3" style={{ backgroundColor: XLS.rowFillB }}>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#1F2937] mb-1.5">
                  Final Summary:
                </div>
                {(
                  [
                    { label: 'Total Property Value:', value: costOfLand, cls: 'text-[#1F2937]' },
                    { label: 'Total Amount Received:', value: receivedAmount, cls: 'text-emerald-700' },
                    { label: 'Balance Payable:', value: balanceAmount, cls: 'text-red-600' },
                  ] as const
                ).map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-[#9DC3E6]/40 py-1 text-[11px] font-semibold text-slate-600 last:border-0">
                    <span>{row.label}</span>
                    <span className={`font-black ${row.cls}`}>Rs. {fmtMoney(row.value)}/-</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== Disclaimer + generated line — Excel rows 57..58 ===== */}
            <p className="text-center text-[10px] italic text-slate-500 mt-4 leading-snug">
              This is a computer-generated customer ledger statement. For any discrepancies, please
              contact accounts department.
            </p>
            <p className="text-center text-[9px] font-bold text-slate-400 mt-1">
              Generated on: {new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}{' '}
              | Page 1 of 1
            </p>

            {/* ===== Signatures — Excel rows 60..61 ===== */}
            <div className="mt-6 grid grid-cols-3 gap-x-8 gap-y-4 text-[11px] font-bold text-slate-600 px-2">
              {(
                [
                  {
                    label: 'Prepared By',
                    sub: 'Accounts Department',
                    left: true,
                  },
                  { label: 'Checked By', sub: 'Finance Manager', left: false },
                  { label: 'Authorized By', sub: 'Director', left: false },
                ] as const
              ).map((sig) => (
                <div key={sig.label} className={`h-14 flex flex-col ${sig.left ? 'items-start' : 'items-center'} justify-end`}>
                  <span className="block border-b border-dotted border-slate-300 w-full h-4" />
                  <span className="block mt-1 text-[9px] uppercase tracking-widest text-slate-400">
                    {sig.label} · {sig.sub}
                  </span>
                </div>
              ))}
            </div>

            {/* Ledger toolbar (added row) */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FaListOl className="text-[#0B5EA8]" /> Payment Schedule
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold">
                  {draftRows.length} rows
                </span>
              </h3>
              <div className="flex items-center gap-2">
                {canEdit && draftRows.length === 0 && (
                  <button
                    type="button"
                    onClick={() => void handleGenerateSchedule()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#0B5EA8]/10 text-[#0B5EA8] border border-[#0B5EA8]/30 rounded-lg text-[11px] font-bold transition hover:bg-[#0B5EA8]/20"
                  >
                    <FaPlus className="text-[10px]" /> Generate 31-Row Schedule
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1.5 h-8 px-3 bg-white border border-slate-300 text-slate-600 rounded-lg text-[11px] font-bold transition hover:border-brand-blue hover:text-brand-dark"
                  >
                    <FaPlus className="text-[10px]" /> Add Row
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function emptyDraft(seq: number): DraftRow {
    return {
      rowId: null,
      seq,
      description: 'Installment',
      instNo: `Inst-${String(seq).padStart(2, '0')}`,
      dueDate: todayDMY(),
      dueAmount: '',
      paidAmount: '',
      paidDate: '',
      outstanding: 0,
    };
  }
}