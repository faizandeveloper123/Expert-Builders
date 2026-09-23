import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  FaFileInvoice,
  FaFilePdf,
  FaFloppyDisk,
  FaMagnifyingGlass,
  FaPlus,
  FaPrint,
  FaRegTrashCan,
  FaRotateRight,
  FaPenToSquare,
  FaChartLine,
} from 'react-icons/fa6';
import { api, type ApiReceipt, type ReceiptInput } from '../api';
import { useAuth } from '../auth';
import BrandLogo from './BrandLogo';

/* ------------------------------ helpers ------------------------------ */

function parseNum(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return '0.00';
  return amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function todayDMY(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Parse the free-text "DD/MM/YYYY" date into a Date (or null). */
function parseDMY(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_ABB = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Whole-number money "1400000" -> "1,400,000" (PDF shows no decimals). */
function formatInt(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return Math.round(amount).toLocaleString('en-US');
}

/** "DD/MM/YYYY" (or parseable) -> "05 Apr 2025" as shown in the PDF. */
function formatDatePDF(value: string | null | undefined): string {
  const d = parseDMY(value);
  if (!d) return value || '';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTH_ABB[d.getMonth()]} ${d.getFullYear()}`;
}

/** Convert a number to English words ("15,000" -> "Fifteen Thousand"). */
function numberToEnglishWords(input: number): string {
  if (!Number.isFinite(input) || input <= 0) return '';
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
    'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

  const twoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? ' ' + ones[o] : '');
  };

  const threeDigits = (n: number): string => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let s = '';
    if (h) s += ones[h] + ' Hundred';
    if (rest) s += (s ? ' ' : '') + twoDigits(rest);
    return s;
  };

  const groups: number[] = [];
  let n = Math.floor(input);
  if (n === 0) return 'Zero';
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i]) {
      const chunk = threeDigits(groups[i]);
      parts.push(chunk + (scales[i] ? ' ' + scales[i] : ''));
    }
  }
  return parts.join(' ');
}

/* ----------------------- voucher form state ------------------------- */

interface VoucherFormState {
  receiptNo: string;
  regNo: string;
  dated: string;
  receivedFrom: string;
  amount: string;
  amountWords: string;
  paymentType: string;
  paymentVia: string;
  previousBalance: string;
  fileDetails: string;
}

const EMPTY_FORM: VoucherFormState = {
  receiptNo: '',
  regNo: '',
  dated: '',
  receivedFrom: '',
  amount: '',
  amountWords: '',
  paymentType: 'Advance',
  paymentVia: 'Cash',
  previousBalance: '',
  fileDetails: '',
};

function emptyFormWithDefaults(): VoucherFormState {
  return { ...EMPTY_FORM, dated: todayDMY() };
}

const COMPANY_LINE = "EXPERT MARKETING AND DEVELOPER'S";
const COMPANY_ADDRESS =
  'Abdul Majeed Plaza, Main Chakri Road, Peer Mehar Ali Shah Town, Near Royal Grand Marquee, Rawalpindi.';
const COMPANY_CONTACT_ALT =
  'Mobile # 0300-5551350&nbsp; | &nbsp;Ph: 051-5575280&nbsp; | &nbsp;Email: expertbuilders39@gmail.com';

/** PDF-derived palette (Expert_Receipt_Voucher.pdf). */
const RV = {
  banner: '#123A7A', // header banner fill (0.07, 0.25, 0.48)
  labelCell: '#F3F6F9', // light label cells + summary bar
  border: '#7F8C8D', // thin table rules
  dark: '#222222', // headings / values
  grey: '#666666', // address line
  paid: '#C80F12', // PAID stamp
};

/* --------------------- lazy html2pdf (CDN) loader -------------------- */

const HTML2PDF_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
const QRCODE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

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
    script.src = HTML2PDF_CDN;
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

type QRCodeApi = {
  new (el: HTMLElement | string, opts: {
    text: string;
    width: number;
    height: number;
    colorDark?: string;
    colorLight?: string;
    correctLevel?: number;
  }): unknown;
  CorrectLevel: { M: number };
};

function getQRCode(): QRCodeApi | null {
  const w = window as unknown as { QRCode?: QRCodeApi };
  return w.QRCode ?? null;
}

function loadQRCode(): Promise<QRCodeApi> {
  return new Promise((resolve, reject) => {
    const existing = getQRCode();
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement('script');
    script.src = QRCODE_CDN;
    script.async = true;
    script.onload = () => {
      const lib = getQRCode();
      if (lib) resolve(lib);
      else reject(new Error('QR library failed to initialise'));
    };
    script.onerror = () => reject(new Error('Could not load the QR library'));
    document.head.appendChild(script);
  });
}

/* ================================ page ============================== */

interface ReceiptVoucherPageProps {
  onNotify: (msg: string) => void;
}

export default function ReceiptVoucherPage({ onNotify }: ReceiptVoucherPageProps) {
  const { user, hasActionPermission } = useAuth();
  const canEdit = hasActionPermission('invoices', 'Invoices', 'edit');
  const canDelete = hasActionPermission('invoices', 'Invoices', 'delete');
  const canExport = hasActionPermission('invoices', 'Invoices', 'export');

  const [form, setForm] = useState<VoucherFormState>(emptyFormWithDefaults);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoHeight, setLogoHeight] = useState(105);
  const [qrSize, setQrSize] = useState(105);
  const qrHostRef = useRef<HTMLDivElement | null>(null);

  const [receipts, setReceipts] = useState<ApiReceipt[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [view, setView] = useState<'editor' | 'dashboard'>('editor');
  const [rangeKey, setRangeKey] = useState<'all' | 'month' | 'year'>('all');
  const [dashSearch, setDashSearch] = useState('');

  const docRef = useRef<HTMLDivElement | null>(null);

  /* While the editor is mounted every print outputs only the voucher sheet. */
  useEffect(() => {
    if (view !== 'editor') {
      document.body.classList.remove('rv-printing');
      return undefined;
    }
    document.body.classList.add('rv-printing');
    return () => document.body.classList.remove('rv-printing');
  }, [view]);

  /* Suggested next sequential receipt number for a fresh voucher. */
  useEffect(() => {
    let active = true;
    api
      .nextReceiptNumber()
      .then((res) => {
        if (!active) return;
        setForm((prev) => (prev.receiptNo === '' ? { ...prev, receiptNo: res.data.receipt_no } : prev));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  /* Logo upload handler. */
  const handleLogoChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const loadReceipts = useCallback(async () => {
    setLoadingList(true);
    try {
      const params: { created_by?: number } = {};
      if (user && user.user_type !== 'Admin') params.created_by = user.id;
      const res = await api.listReceipts(params);
      setReceipts(res.data);
    } catch (err) {
      onNotify(`Failed to load receipts: ${(err as Error).message}`);
    } finally {
      setLoadingList(false);
    }
  }, [user, onNotify]);

  useEffect(() => {
    if (view === 'dashboard') void loadReceipts();
  }, [view, loadReceipts]);

  /* ------------------------- live calculations ------------------------ */

  const amount = parseNum(form.amount);
  const previousBalance = parseNum(form.previousBalance);
  const currentBalance = previousBalance > 0 ? Math.max(0, previousBalance - amount) : 0;

  /* Generate QR in the top-right of the sheet from the current receipt data. */
  useEffect(() => {
    const host = qrHostRef.current;
    if (!host) return;
    const qrText = `EXPERT MARKETING & DEVELOPERS\nReceipt No: ${form.receiptNo || 'RDC-'}\nReg No: ${form.regNo || ''}\nAmount: PKR ${formatInt(amount)}`;
    let cancelled = false;
    const render = (QR: QRCodeApi) => {
      if (cancelled || !qrHostRef.current) return;
      qrHostRef.current.innerHTML = '';
      try {
        new QR(qrHostRef.current, {
          text: qrText,
          width: qrSize,
          height: qrSize,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: QR.CorrectLevel.M,
        });
      } catch {
        /* silent */
      }
    };
    const existing = getQRCode();
    if (existing) {
      render(existing);
    } else {
      loadQRCode()
        .then(render)
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [form.receiptNo, form.regNo, amount, qrSize]);

  /* Keep "Amount in Words" in sync unless the user typed their own. */
  const autoWords = useMemo(() => {
    if (!amount) return '';
    return `${numberToEnglishWords(amount)} Only`;
  }, [amount]);

  const amountWords = form.amountWords.trim();

  /* ---------------------------- actions ------------------------------- */

  const setField =
    (key: keyof VoucherFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'amount' && (prev.amountWords === autoWords || prev.amountWords === '')) {
          const n = parseNum(value);
          next.amountWords = n ? `${numberToEnglishWords(n)} Only` : '';
        }
        return next;
      });
    };

  const handleNew = () => {
    setEditingId(null);
    setView('editor');
    setForm(emptyFormWithDefaults());
    api
      .nextReceiptNumber()
      .then((res) => setForm((prev) => ({ ...prev, receiptNo: res.data.receipt_no })))
      .catch(() => undefined);
  };

  const buildPayload = (): ReceiptInput => ({
    receipt_no: form.receiptNo.trim(),
    reg_no: form.regNo.trim(),
    dated: form.dated.trim(),
    received_from: form.receivedFrom.trim(),
    amount,
    amount_words: amountWords || autoWords,
    payment_type: form.paymentType.trim(),
    payment_via: form.paymentVia.trim(),
    previous_balance: previousBalance,
    current_balance: currentBalance,
    file_details: form.fileDetails.trim(),
    created_by: user?.id ?? null,
  });

  const handleSave = async () => {
    if (!canEdit || saving) return;
    if (!form.receiptNo.trim()) {
      onNotify('Receipt number is required');
      return;
    }
    if (!form.receivedFrom.trim()) {
      onNotify('Customer name (Received From) is required');
      return;
    }
    if (amount <= 0) {
      onNotify('Please enter a valid payment amount');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId !== null) {
        await api.updateReceipt(editingId, payload);
        onNotify(`Receipt "${payload.receipt_no}" updated — account statement synced`);
      } else {
        const res = await api.createReceipt(payload);
        setEditingId(res.data.id);
        onNotify(`Receipt "${payload.receipt_no}" saved to database`);
      }
      await loadReceipts();
    } catch (err) {
      onNotify(`Save failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (r: ApiReceipt) => {
    setEditingId(r.id);
    setForm({
      receiptNo: r.receipt_no,
      regNo: r.reg_no ?? '',
      dated: r.dated ?? '',
      receivedFrom: r.received_from ?? '',
      amount: String(r.amount ?? 0),
      amountWords: r.amount_words ?? '',
      paymentType: r.payment_type ?? '',
      paymentVia: r.payment_via ?? '',
      previousBalance: String(r.previous_balance ?? 0),
      fileDetails: r.file_details ?? '',
    });
    setView('editor');
    onNotify(`Loaded receipt "${r.receipt_no}"`);
  };

  const handleDelete = async (r: ApiReceipt) => {
    if (!canDelete) return;
    if (!window.confirm(`Delete receipt "${r.receipt_no}"? This cannot be undone.`)) return;
    try {
      await api.deleteReceipt(r.id);
      if (editingId === r.id) setEditingId(null);
      onNotify(`Receipt "${r.receipt_no}" deleted`);
      await loadReceipts();
    } catch (err) {
      onNotify(`Delete failed: ${(err as Error).message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!docRef.current || pdfBusy) return;
    setPdfBusy(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      await html2pdf()
        .set({
          margin: [0.2, 0.2, 0.2, 0.2],
          filename: `ExpertBuilders_Receipt_Voucher_${form.receiptNo.trim() || 'draft'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        })
        .from(docRef.current)
        .save();
    } catch (err) {
      onNotify(`${(err as Error).message} - opening the print dialog instead`);
      window.print();
    } finally {
      setPdfBusy(false);
    }
  };

  /* ------------------------- dashboard derivations --------------------- */

  const filteredReceipts = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const q = dashSearch.trim().toLowerCase();
    return receipts
      .filter((r) => {
        const d = parseDMY(r.dated);
        if (rangeKey === 'month' && (!d || d < monthStart)) return false;
        if (rangeKey === 'year' && (!d || d < yearStart)) return false;
        if (q) {
          const hay = `${r.receipt_no} ${r.received_from} ${r.reg_no} ${r.payment_type}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = parseDMY(a.dated)?.getTime() ?? 0;
        const db = parseDMY(b.dated)?.getTime() ?? 0;
        return db - da || b.id - a.id;
      });
  }, [receipts, rangeKey, dashSearch]);

  const dashCount = filteredReceipts.length;
  const dashTotal = filteredReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  /* ----------------------------- shared cell --------------------------- */

  /** One editable "label | value" pair (mirrors the PDF table pairing). */
  const FieldCell = ({
    label,
    value,
    onChange,
    className = '',
    bold = false,
    merged = false,
    kind = 'text',
    placeholder = '',
    step = 'any',
    labelW = 32,
    twoLine = true,
  }: {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    bold?: boolean;
    merged?: boolean;
    kind?: 'text' | 'number';
    placeholder?: string;
    step?: string;
    labelW?: number;
    twoLine?: boolean;
  }) => (
    <div
      className={`flex items-stretch flex-1 min-w-0 overflow-hidden box-border ${
        merged ? '' : 'border-r border-[#7F8C8D]'
      } ${className}`}
    >
      <div
        className={`flex items-center px-1.5 sm:px-2 py-1.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wide text-[#222222] leading-[1.15] ${twoLine ? '' : 'whitespace-nowrap'}`}
        style={{ backgroundColor: RV.labelCell, width: `${labelW}%`, minWidth: 0 }}
      >
        {label}
      </div>
      <input
        type={kind}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={kind === 'number' ? step : undefined}
        className={`rv-input flex-1 min-w-0 w-full px-1.5 sm:px-2 py-1.5 text-[10px] sm:text-[11px] bg-transparent font-semibold text-[#222222] placeholder-[#9aa4ad] ${
          bold ? 'font-bold' : ''
        }`}
      />
    </div>
  );

  return (
    <>
      <style>{`
        .rv-input { border-bottom: 1.5px dotted #b6bfc7; background: transparent; transition: border-color .15s ease; }
        .rv-input:focus { border-bottom: 1.5px solid #123A7A; outline: none; background-color: rgba(254, 243, 199, 0.35); }
        .rv-sel { border-bottom: 1.5px dotted #b6bfc7; background: transparent; }
        .rv-sel:focus { border-bottom: 1.5px solid #123A7A; outline: none; }
        @media print {
          body.rv-printing * { visibility: hidden !important; }
          body.rv-printing .rv-page, body.rv-printing .rv-page * { visibility: visible !important; }
          body.rv-printing .rv-scroll-host { overflow: visible !important; padding: 0 !important; }
          body.rv-printing .rv-page { position: absolute; left: 0; top: 0; width: 100% !important; min-width: 0 !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; }
          body.rv-printing input, body.rv-printing select { border: none !important; box-shadow: none !important; background: transparent !important; }
        }
      `}</style>

      <div className="h-full overflow-y-auto bg-slate-100 min-w-0">
        <div className="max-w-[1440px] mx-auto px-3 md:px-6 pb-8">
          {/* Page heading + sticky action bar */}
          <div className="rv-no-print sticky top-0 z-30 -mx-3 md:-mx-6 px-3 md:px-6 pt-4 pb-3 mb-5 bg-slate-100/85 backdrop-blur-md border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#123A7A] flex items-center justify-center shadow-md ring-1 ring-black/10">
                <BrandLogo wordmark={false} chip={false} className="h-[62%] w-auto" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Receipt Voucher
                </h1>
                <p className="text-xs text-slate-500">
                  Record payments received from clients — saved vouchers update the Account Statement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {editingId !== null && (
                <span className="inline-flex items-center gap-1.5 bg-brand-blue/10 text-brand-dark border border-brand-blue/30 rounded-lg px-2.5 py-2 text-[11px] font-bold">
                  <FaPenToSquare className="text-[10px]" />
                  Editing #{form.receiptNo || editingId}
                </span>
              )}
              <button
                type="button"
                onClick={() => setView((v) => (v === 'editor' ? 'dashboard' : 'editor'))}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98] ${
                  view === 'dashboard'
                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                <FaChartLine className="text-brand-blue" />
                {view === 'editor' ? 'Receipt History' : 'Back to Editor'}
              </button>
              {view === 'editor' && (
                <>
                  <button
                    type="button"
                    onClick={handleNew}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 hover:border-slate-400 shadow-sm transition active:scale-[0.98]"
                  >
                    <FaPlus className="text-[10px]" /> New
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={!canEdit || saving}
                    title={canEdit ? 'Save receipt to database' : 'You do not have edit permission'}
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-brand-blue hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm shadow-brand-blue/40 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <FaFloppyDisk className={saving ? 'animate-pulse' : ''} />
                    {saving ? 'Saving...' : editingId !== null ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 hover:border-slate-400 shadow-sm transition active:scale-[0.98]"
                  >
                    <FaPrint /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdf()}
                    disabled={!canExport || pdfBusy}
                    title={canExport ? 'Download as PDF' : 'You do not have export permission'}
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-brand-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaFilePdf className={`text-brand-blue ${pdfBusy ? 'animate-pulse' : ''}`} />
                    {pdfBusy ? 'Preparing...' : 'Download PDF'}
                  </button>
                </>
              )}
            </div>
          </div>

          {view === 'dashboard' ? (
            /* --------------------- Receipt dashboard --------------------- */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#123A7A]/10 text-[#123A7A] flex items-center justify-center shrink-0">
                    <FaFileInvoice />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Receipts</div>
                    <div className="text-xl font-black text-slate-900">{loadingList ? '...' : dashCount}</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#123A7A]/10 text-[#123A7A] flex items-center justify-center shrink-0">
                    <FaChartLine />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Amount Received</div>
                    <div className="text-xl font-black text-slate-900 truncate">
                      Rs {loadingList ? '...' : formatMoney(dashTotal)}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                    <FaRotateRight />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Auto-Sync
                    </div>
                    <div className="text-sm font-bold text-white leading-tight">
                      Vouchers update the linked Account Statement automatically
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters bar */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center gap-2">
                {(
                  [
                    ['all', 'All'],
                    ['month', 'This Month'],
                    ['year', 'This Year'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRangeKey(key)}
                    className={`h-7 px-3 rounded-full text-[11px] font-bold transition active:scale-[0.97] ${
                      rangeKey === key
                        ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/40'
                        : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-brand-blue/50 hover:text-brand-dark'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="relative ml-auto">
                  <FaMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]" />
                  <input
                    type="text"
                    placeholder="Search #no, customer, reg..."
                    value={dashSearch}
                    onChange={(e) => setDashSearch(e.target.value)}
                    className="h-7 w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 text-[11px] focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void loadReceipts()}
                  className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-brand-blue hover:border-brand-blue/50 transition flex items-center justify-center shrink-0"
                  aria-label="Refresh history"
                  title="Refresh"
                >
                  <FaRotateRight className="text-[11px]" />
                </button>
              </div>

              {/* Receipt history table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Receipt History
                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                      {loadingList ? '...' : dashCount}
                    </span>
                  </h3>
                  <span className="text-xs font-extrabold text-brand-dark whitespace-nowrap">
                    Rs {formatMoney(dashTotal)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[760px]">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50/70 border-b border-slate-200">
                        <th className="py-2.5 pl-4 pr-3 font-extrabold">Date &amp; Day</th>
                        <th className="py-2.5 pr-3 font-extrabold">Receipt#</th>
                        <th className="py-2.5 pr-3 font-extrabold">Received From</th>
                        <th className="py-2.5 pr-3 font-extrabold">Reg # / File</th>
                        <th className="py-2.5 pr-3 font-extrabold">Type / Via</th>
                        <th className="py-2.5 pr-3 font-extrabold text-right">Amount</th>
                        <th className="py-2.5 pr-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {loadingList ? (
                        <tr>
                          <td colSpan={7} className="text-center text-slate-400 py-8">
                            Loading receipts...
                          </td>
                        </tr>
                      ) : dashCount === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10">
                            <FaFileInvoice className="text-3xl text-slate-200 mx-auto mb-2" />
                            <p className="text-slate-400 text-[11px]">No receipts found for this filter.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredReceipts.map((r) => {
                          const d = parseDMY(r.dated);
                          return (
                            <tr
                              key={r.id}
                              onClick={() => handleLoad(r)}
                              className="border-b border-slate-50 last:border-0 cursor-pointer transition hover:bg-brand-blue/[0.04]"
                              title="Open in editor"
                            >
                              <td className="py-2.5 pl-4 pr-3">
                                <div className="font-bold text-slate-800 whitespace-nowrap">{r.dated || '-'}</div>
                                <div className="text-[10px] text-slate-400">
                                  {d ? DAY_NAMES[d.getDay()] : 'Unknown day'}
                                </div>
                              </td>
                              <td className="py-2.5 pr-3 font-mono font-extrabold text-[#123A7A] whitespace-nowrap">
                                {r.receipt_no}
                              </td>
                              <td className="py-2.5 pr-3 font-bold text-slate-800 max-w-[190px] truncate">
                                {r.received_from || 'Unnamed customer'}
                              </td>
                              <td className="py-2.5 pr-3 text-slate-600 max-w-[150px] truncate">
                                {r.reg_no || '-'}
                              </td>
                              <td className="py-2.5 pr-3 text-slate-600">
                                {r.payment_type || '-'}
                                {r.payment_via ? ` / ${r.payment_via}` : ''}
                              </td>
                              <td className="py-2.5 pr-3 text-right font-extrabold text-brand-dark whitespace-nowrap">
                                Rs {formatMoney(Number(r.amount) || 0)}
                              </td>
                              <td className="py-2.5 pr-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => void handleDelete(r)}
                                    className="text-slate-300 hover:text-red-600 transition p-1.5 rounded-md hover:bg-red-50"
                                    aria-label={`Delete receipt ${r.receipt_no}`}
                                    title="Delete"
                                  >
                                    <FaRegTrashCan className="text-xs" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* --------------------- Entry panel --------------------- */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h2 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FaFileInvoice className="text-[#123A7A]" /> Receipt Entry
                    </span>
                    <span className="text-[10px] bg-[#123A7A]/10 text-[#123A7A] border border-[#123A7A]/25 px-2 py-0.5 rounded font-bold">
                      Live Preview
                    </span>
                  </h2>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="block font-semibold text-slate-700 mb-1">Receipt No</span>
                        <input
                          type="text"
                          value={form.receiptNo}
                          onChange={setField('receiptNo')}
                          className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                        />
                      </label>
                      <label className="block">
                        <span className="block font-semibold text-slate-700 mb-1">Reg #</span>
                        <input
                          type="text"
                          placeholder="e.g. RDC-1487"
                          value={form.regNo}
                          onChange={setField('regNo')}
                          className="w-full p-2 border border-slate-300 rounded font-mono focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="block font-semibold text-slate-700 mb-1">Date</span>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={form.dated}
                        onChange={setField('dated')}
                        className="w-full p-2 border border-slate-300 rounded focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                      />
                    </label>

                    <label className="block">
                      <span className="block font-semibold text-slate-700 mb-1">Received From</span>
                      <input
                        type="text"
                        placeholder="Customer / member name"
                        value={form.receivedFrom}
                        onChange={setField('receivedFrom')}
                        className="w-full p-2 border border-slate-300 rounded font-semibold focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="block font-semibold text-slate-700 mb-1">Amount Received (PKR)</span>
                        <input
                          type="number"
                          step="1"
                          placeholder="e.g. 15000"
                          value={form.amount}
                          onChange={setField('amount')}
                          className="w-full p-2 border border-slate-300 rounded font-bold text-sm text-slate-800 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                        />
                      </label>
                      <label className="block">
                        <span className="block font-semibold text-slate-700 mb-1">Payment Via</span>
                        <select
                          value={form.paymentVia}
                          onChange={setField('paymentVia')}
                          className="w-full p-2 border border-slate-300 rounded bg-white focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Online">Online</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="block font-semibold text-slate-700 mb-1">Payment Type</span>
                        <select
                          value={form.paymentType}
                          onChange={setField('paymentType')}
                          className="w-full p-2 border border-slate-300 rounded bg-white focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                        >
                          <option value="Advance">Advance</option>
                          <option value="Regular Installment">Regular Installment</option>
                          <option value="Half-Yearly Installment">Half-Yearly Installment</option>
                          <option value="Full Payment">Full Payment</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="block font-semibold text-slate-700 mb-1">Previous Balance</span>
                        <input
                          type="number"
                          step="1"
                          placeholder="e.g. 1400000"
                          value={form.previousBalance}
                          onChange={setField('previousBalance')}
                          className="w-full p-2 border border-slate-300 rounded font-semibold focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="block font-semibold text-slate-700 mb-1">File Details</span>
                      <input
                        type="text"
                        placeholder="e.g. File # 1487, Hill View Block"
                        value={form.fileDetails}
                        onChange={setField('fileDetails')}
                        className="w-full p-2 border border-slate-300 rounded focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue/40"
                      />
                    </label>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="bg-[#123A7A]/10 p-2.5 rounded-lg border border-[#123A7A]/25">
                        <span className="block text-[#123A7A] mb-1 text-[11px] font-bold">
                          Amount in Words (auto-filled)
                        </span>
                        <input
                          type="text"
                          value={amountWords || autoWords}
                          onChange={setField('amountWords')}
                          className="w-full p-2 bg-white border border-[#123A7A] rounded font-semibold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue/30"
                        />
                      </div>
                      <div className="mt-2.5 bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[11px]">
                        <span className="block text-white font-bold mb-0.5">Current Balance</span>
                        <div className="font-black text-white text-base text-right">
                          Rs {formatMoney(currentBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-300 rounded-xl p-4 text-xs space-y-1.5 shadow-sm">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <FaRotateRight className="text-brand-blue text-sm" /> Live Interactive Editor
                  </div>
                  <p className="leading-relaxed">
                    Fill the form on the left or type directly on the dotted lines inside the
                    voucher preview — both stay in sync. On Save, the payment is automatically
                    applied to the client's Account Statement.
                  </p>
                </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h2 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
                  Logo &amp; QR Controls
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                    <div className="font-bold text-blue-900 uppercase tracking-wider text-[11px] mb-2">
                      Left Logo
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                    />
                    <label className="block font-medium text-slate-700 mt-3 mb-1">
                      Logo Size (Height px)
                    </label>
                    <input
                      type="range"
                      min={60}
                      max={180}
                      value={logoHeight}
                      onChange={(e) => setLogoHeight(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500">{logoHeight}px</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoDataUrl(null);
                          setLogoHeight(105);
                        }}
                        className="text-[10px] text-rose-600 hover:underline"
                      >
                        Reset Default Logo
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                      Right QR Code
                    </div>
                    <label className="block font-medium text-slate-700 mb-1">QR Size (px)</label>
                    <input
                      type="range"
                      min={60}
                      max={160}
                      value={qrSize}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="w-full accent-slate-800"
                    />
                    <div className="text-[10px] text-right text-slate-500 mt-1">{qrSize}px</div>
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------- Document canvas -------------------- */}
              <div className="lg:col-span-8">
                <div className="rv-scroll-host flex justify-start md:justify-center items-start overflow-x-auto pb-6">
                  <div className="w-full min-w-[680px] max-w-[800px] px-0.5">
                    <div
                      ref={docRef}
                      className="rv-page bg-white shadow-xl shadow-slate-900/10 rounded-xl text-[#222222] relative overflow-hidden ring-1 ring-slate-200 w-full"
                      style={{ minHeight: 1180, fontFamily: "Arial, 'Segoe UI', sans-serif" }}
                    >
                      {/* Header: Left Logo | Center Text | Right QR */}
                      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-2">
                        <div className="flex items-center justify-start w-[26%] shrink-0">
                          {logoDataUrl ? (
                            <img
                              src={logoDataUrl}
                              alt="Company Logo"
                              className="object-contain"
                              style={{ height: logoHeight, maxWidth: 150 }}
                            />
                          ) : (
                            <img
                              src="/receipt-logo.png"
                              alt="Expert Marketing & Developers Logo"
                              className="object-contain"
                              style={{ height: logoHeight, maxWidth: 150 }}
                            />
                          )}
                        </div>
                        <div className="text-center flex-1 space-y-1">
                          <h1
                            className="text-[19px] font-black uppercase tracking-[0.05em] inline-block pb-0.5 border-b-2 border-[#222222]"
                            style={{ color: RV.dark }}
                          >
                            {COMPANY_LINE}
                          </h1>
                          <p className="text-[10.5px] mt-1 leading-tight max-w-[480px] mx-auto" style={{ color: RV.grey }}>
                            {COMPANY_ADDRESS}
                          </p>
                          <p className="text-[10.5px] font-semibold pt-0.5" style={{ color: RV.dark }}>
                            {COMPANY_CONTACT_ALT}
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center w-[26%] shrink-0">
                          <div
                            ref={qrHostRef}
                            className="p-0.5 border border-slate-300 bg-white"
                            style={{ width: qrSize + 4, height: qrSize + 4 }}
                          />
                          <span className="text-[8.5px] font-bold text-slate-800 mt-1 uppercase tracking-tight">
                            Scan to verify
                          </span>
                        </div>
                      </div>

                      {/* Banner */}
                      <div
                        className="flex items-center justify-center"
                        style={{ backgroundColor: RV.banner, height: 46 }}
                      >
                        <h2 className="text-white font-black uppercase tracking-[0.15em] text-[19px]">
                          Receipt Voucher
                        </h2>
                      </div>

                      {/* Field grid — exact layout of Expert_Receipt_Voucher.pdf */}
                      <div className="px-6 pt-5">
                        <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${RV.border}` }}>
                          {/* Row 1: Receipt No | Reg # | Date | Amount */}
                          <div className="flex" style={{ borderBottom: `1px solid ${RV.border}` }}>
                            <FieldCell label="Receipt No" value={form.receiptNo} onChange={setField('receiptNo')} kind="text" labelW={34} />
                            <FieldCell label="Reg #" value={form.regNo} onChange={setField('regNo')} kind="text" labelW={24} />
                            <FieldCell label="Date" value={formatDatePDF(form.dated)} onChange={setField('dated')} kind="text" labelW={18} />
                            <FieldCell label="Amount" value={form.amount} onChange={setField('amount')} kind="number" labelW={20} merged />
                          </div>

                          {/* Row 2: Received From (full width) */}
                          <div className="flex" style={{ borderBottom: `1px solid ${RV.border}` }}>
                            <FieldCell
                              label="Received From"
                              value={form.receivedFrom}
                              onChange={setField('receivedFrom')}
                              kind="text"
                              merged
                              labelW={9}
                            />
                          </div>

                          {/* Row 3: Amount in Words | Current Balance | Payment Type | Previous Balance */}
                          <div className="flex" style={{ borderBottom: `1px solid ${RV.border}` }}>
                            <FieldCell
                              label="Amount in Words"
                              value={amountWords || autoWords}
                              onChange={setField('amountWords')}
                              kind="text"
                              labelW={34}
                            />
                            <FieldCell
                              label="Current Balance"
                              value={String(currentBalance)}
                              onChange={() => undefined}
                              kind="text"
                              labelW={24}
                              bold
                            />
                            <FieldCell
                              label="Payment Type"
                              value={form.paymentType}
                              onChange={setField('paymentType')}
                              kind="text"
                              labelW={18}
                            />
                            <FieldCell
                              label="Previous Balance"
                              value={form.previousBalance}
                              onChange={setField('previousBalance')}
                              kind="number"
                              labelW={20}
                              merged
                            />
                          </div>

                          {/* Row 4: Payment Via | File Details */}
                          <div className="flex">
                            <FieldCell label="Payment Via" value={form.paymentVia} onChange={setField('paymentVia')} kind="text" labelW={34} />
                            <FieldCell label="File Details" value={form.fileDetails} onChange={setField('fileDetails')} kind="text" labelW={24} merged />
                          </div>
                        </div>

                        {/* Summary bar — mirrors the PDF's highlight panel */}
                        <div className="mt-4" style={{ borderTop: `2px solid ${RV.dark}`, borderBottom: `2px solid ${RV.dark}` }}>
                          <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: RV.labelCell }}>
                            <div>
                              <span className="font-extrabold text-[13px]" style={{ color: RV.dark }}>
                                Amount Received:{' '}
                                <span className="font-black">Rs {formatMoney(amount)}/-</span>
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-[13px]" style={{ color: RV.dark }}>
                                Current Balance:{' '}
                                <span className="font-black">Rs {formatMoney(currentBalance)}/-</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PAID stamp */}
                      <div className="relative mt-8">
                        <div
                          className="pointer-events-none absolute top-1/2 left-1/2 border-4 rounded-lg flex items-center justify-center select-none"
                          style={{
                            borderColor: RV.paid,
                            color: RV.paid,
                            width: 150,
                            height: 70,
                            transform: 'translate(-50%, -50%) rotate(-18deg)',
                            opacity: 0.85,
                          }}
                        >
                          <span className="font-black text-[34px] leading-none tracking-[0.06em]">PAID</span>
                        </div>
                        <div
                          className="mx-auto rounded-md"
                          style={{ width: 320, height: 92, border: `1px solid ${RV.border}`, background: 'transparent' }}
                        >
                          <div className="pt-9 text-center text-[10px] text-slate-300">signature &amp; stamp</div>
                        </div>
                      </div>

                      {/* Signatures: Received By (left) | Sign & Seal (right) matches PDF */}
                      <div className="px-6 mt-7 grid grid-cols-2 gap-6 text-[11px] font-semibold">
                        <div>
                          Received By:{' '}
                          <span className="border-b border-[#222222] inline-block w-44" />
                        </div>
                        <div className="text-right">
                          Sign &amp; Seal: <span className="border-b border-[#222222] inline-block w-44" />
                        </div>
                      </div>

                      <p
                        className="text-center text-[11px] mt-10 italic"
                        style={{ color: RV.grey }}
                      >
                        This is a computer-generated document. No signature is required unless
                        otherwise specified.
                      </p>
                      <div className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}