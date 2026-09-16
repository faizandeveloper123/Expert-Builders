import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import type { IconType } from 'react-icons';
import {
  FaBuilding,
  FaCheck,
  FaChevronRight,
  FaClipboardCheck,
  FaCloudArrowUp,
  FaDiagramProject,
  FaFileExcel,
  FaLocationDot,
  FaTable,
  FaUserGroup,
  FaXmark,
} from 'react-icons/fa6';
import type { ImportResult, ImportSheetData } from '../types';
import { pickNormalizedColumn } from '../utils';

const steps = [
  { num: 1, title: 'Start', subtitle: 'Select objects to import' },
  { num: 2, title: 'Upload', subtitle: 'Upload Excel file' },
  { num: 3, title: 'Preview', subtitle: 'Review sheets & columns' },
  { num: 4, title: 'Verify', subtitle: 'Confirm & create city lists' },
];

interface ImportObject {
  key: string;
  title: string;
  description: string;
  icon: IconType;
}

const importObjects: ImportObject[] = [
  {
    key: 'Contacts',
    title: 'Contacts',
    description: 'Contains contact records and their associated details.',
    icon: FaUserGroup,
  },
  {
    key: 'Opportunities',
    title: 'Opportunities',
    description: 'Includes deals, their stages, statuses, and pipeline progress.',
    icon: FaDiagramProject,
  },
  {
    key: 'Companies',
    title: 'Companies',
    description: 'Contains businesses, their details, and associated contact information.',
    icon: FaBuilding,
  },
];

interface ImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImport: (result: ImportResult) => void;
  onNotify: (msg: string) => void;
}

const PREVIEW_ROWS = 10;

function ImportWizard({ open, onClose, onImport, onNotify }: ImportWizardProps) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set(['Contacts']));
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [sheets, setSheets] = useState<ImportSheetData[]>([]);
  const [cityColumn, setCityColumn] = useState<string | null>(null);
  const [previewSheet, setPreviewSheet] = useState(0);
  const [consent, setConsent] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelected(new Set(['Contacts']));
      setFile(null);
      setSheets([]);
      setCityColumn(null);
      setPreviewSheet(0);
      setConsent(true);
      setParsing(false);
    }
  }, [open]);

  const totalRows = useMemo(() => sheets.reduce((a, s) => a + s.rows.length, 0), [sheets]);
  const totalCols = useMemo(() => sheets.reduce((a, s) => a + s.headers.length, 0), [sheets]);

  const cityGroups = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    if (cityColumn) {
      for (const s of sheets) {
        for (const r of s.rows) {
          const v = (r[cityColumn] ?? '').trim();
          if (!v) continue;
          const key = v.toLowerCase();
          const prev = map.get(key);
          map.set(key, { label: prev ? prev.label : v, count: (prev?.count ?? 0) + 1 });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [sheets, cityColumn]);

  if (!open) return null;

  const parseFile = async (f: File) => {
    setParsing(true);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const parsed: ImportSheetData[] = wb.SheetNames.map((sheetName) => {
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        if (json.length === 0) return { name: sheetName, headers: [], rows: [] };
        const headers = Object.keys(json[0]);
        const rows = json.map((r) => {
          const out: Record<string, string> = {};
          headers.forEach((h) => {
            const v = r[h];
            out[h] = v == null ? '' : String(v).trim();
          });
          return out;
        });
        return { name: sheetName, headers, rows };
      }).filter((s) => s.headers.length > 0);

      setSheets(parsed);
      const allHeaders = Array.from(new Set(parsed.flatMap((s) => s.headers)));
      setCityColumn(pickNormalizedColumn(allHeaders, [/city/i]) ?? null);
      setPreviewSheet(0);
      onNotify(`"${f.name}" read successfully (${parsed.length} sheet${parsed.length === 1 ? '' : 's'})`);
    } catch (err) {
      onNotify(`Could not read the file: ${(err as Error).message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (!f) return;
    setFile(f);
    void parseFile(f);
  };

  const goToStep = (n: number) => {
    if (n > 2 && sheets.length === 0) {
      onNotify('Please upload an Excel file first.');
      return;
    }
    setStep(Math.min(4, Math.max(1, n)));
  };

  const handleNext = () => {
    if (step < 4) {
      if (step === 1 && !selected.has('Contacts')) {
        onNotify('Contacts import is always included.');
        setSelected((prev) => new Set(prev).add('Contacts'));
      }
      setStep(step + 1);
    } else {
      executeImport();
    }
  };

  const executeImport = () => {
    if (!consent) {
      onNotify('Please confirm the consent agreement before importing.');
      return;
    }
    if (!file || sheets.length === 0) {
      onNotify('Please upload a valid Excel file first.');
      return;
    }
    onImport({ fileName: file.name, sheets, totalRows, cityColumn });
    onClose();
  };

  const stepIconClass = (n: number) => {
    if (n === step)
      return 'w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-sm';
    if (n < step)
      return 'w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center';
    return 'w-7 h-7 rounded-full border-2 border-slate-300 bg-white text-slate-500 text-xs font-bold flex items-center justify-center';
  };

  const stepTitleClass = (n: number) => {
    if (n === step) return 'text-xs font-bold text-blue-600';
    if (n < step) return 'text-xs font-semibold text-slate-700';
    return 'text-xs font-semibold text-slate-600';
  };

  const headerOpacity = (n: number) => (n <= step ? '' : 'opacity-50');

  return (
    <div className="fixed inset-0 z-50 flex-col flex">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative flex flex-col h-full w-full">
        {/* Top Wizard Navigation Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Imports</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload an Excel file and get city-wise smart lists automatically
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <FaXmark className="text-lg" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-50/70 border-b border-slate-200 px-6 py-3.5 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between relative">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div
                  className={`flex items-center space-x-2.5 z-10 cursor-pointer ${headerOpacity(s.num)}`}
                  onClick={() => goToStep(s.num)}
                >
                  <div className={stepIconClass(s.num)}>
                    {s.num < step ? <FaCheck className="text-[10px]" /> : s.num}
                  </div>
                  <div className="flex flex-col">
                    <span className={stepTitleClass(s.num)}>{s.title}</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {s.subtitle}
                    </span>
                  </div>
                </div>
                {idx < steps.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-3" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Wizard Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {step === 1 && (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">
                    Select objects to import
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {importObjects.map((obj) => {
                      const isSelected = selected.has(obj.key);
                      const Icon = obj.icon;
                      return (
                        <div
                          key={obj.key}
                          onClick={() => {
                            if (obj.key === 'Contacts') return;
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(obj.key)) next.delete(obj.key);
                              else next.add(obj.key);
                              return next;
                            });
                          }}
                          className={
                            isSelected
                              ? 'border-2 border-blue-600 bg-blue-50/40 rounded-xl p-4 cursor-pointer relative transition hover:shadow-sm'
                              : 'border border-slate-200 bg-white hover:border-slate-300 rounded-xl p-4 cursor-pointer relative transition'
                          }
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className={
                                isSelected
                                  ? 'w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm mb-3'
                                  : 'w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-sm mb-3'
                              }
                            >
                              <Icon />
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="h-4 w-4 text-blue-600 rounded border-slate-300"
                            />
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mb-1">{obj.title}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {obj.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-4">
                    When you import, all leads are added to Contacts and a smart list is
                    created for every city found in your file.
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Upload your Excel file</h3>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/60 cursor-pointer transition group"
                >
                  <FaCloudArrowUp className="text-3xl text-slate-400 group-hover:text-blue-600 transition mb-2 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Click to upload or drag & drop file
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supported formats: .XLSX, .XLS, .CSV (up to 10MB) - all sheets are read
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileSelect}
                    aria-label="Upload import file"
                  />
                </div>

                {parsing && (
                  <div className="flex items-center justify-center text-xs text-slate-500 py-2">
                    Reading file...
                  </div>
                )}

                {!parsing && file && sheets.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <FaFileExcel className="text-emerald-600 text-lg" />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{file.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {(file.size / 1024).toFixed(1)} KB • {sheets.length} sheet
                            {sheets.length === 1 ? '' : 's'} • {totalRows.toLocaleString()} rows •{' '}
                            {totalCols} columns
                          </div>
                        </div>
                      </div>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-semibold">
                        Ready
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-slate-400 text-[11px] font-medium">Sheets</div>
                        <div className="text-lg font-bold text-slate-800">{sheets.length}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-slate-400 text-[11px] font-medium">Total rows</div>
                        <div className="text-lg font-bold text-slate-800">
                          {totalRows.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-slate-400 text-[11px] font-medium">Total columns</div>
                        <div className="text-lg font-bold text-slate-800">{totalCols}</div>
                      </div>
                    </div>

                    {cityColumn ? (
                      <div className="flex items-start gap-2 px-4 py-3 bg-blue-50/70 border-t border-blue-100 text-xs text-blue-700">
                        <FaLocationDot className="mt-0.5 flex-shrink-0" />
                        <span>
                          City column <b>"{cityColumn}"</b> detected —{' '}
                          <b>{cityGroups.length}</b> city smart list
                          {cityGroups.length === 1 ? '' : 's'} will be created automatically.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
                        <FaLocationDot className="mt-0.5 flex-shrink-0" />
                        <span>
                          No <b>City</b> column found. The leads will be imported without
                          city-wise smart lists.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 3 && sheets.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      All columns from the uploaded sheets
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Every sheet is shown with all of its columns and data.
                    </p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-100 font-semibold">
                    {totalCols} Columns
                  </span>
                </div>

                {sheets.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sheets.map((s, i) => (
                      <button
                        key={s.name}
                        onClick={() => setPreviewSheet(i)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                          previewSheet === i
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                        }`}
                      >
                        <FaTable className="inline mr-1.5 text-[10px]" />
                        {s.name}
                        <span className="ml-1 opacity-70">({s.rows.length})</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        {sheets[previewSheet].headers.map((h) => (
                          <th key={h} className="py-2 px-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {sheets[previewSheet].rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                        <tr key={i}>
                          {sheets[previewSheet].headers.map((h) => (
                            <td key={h} className="py-1.5 px-3 whitespace-nowrap">
                              {r[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sheets[previewSheet].rows.length > PREVIEW_ROWS && (
                  <p className="text-[11px] text-slate-400">
                    Showing first {PREVIEW_ROWS} of{' '}
                    {sheets[previewSheet].rows.length.toLocaleString()} rows.
                  </p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                    <FaClipboardCheck />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Review & Confirm Import</h3>
                    <p className="text-xs text-slate-500">
                      Verify details before importing records into CRM Contacts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] block font-medium">Source File</span>
                    <span className="font-bold text-slate-800 truncate block">{file?.name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] block font-medium">Sheets</span>
                    <span className="font-bold text-slate-800">{sheets.length}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] block font-medium">
                      Records Detected
                    </span>
                    <span className="font-bold text-emerald-600">
                      {totalRows.toLocaleString()} Leads
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[11px] block font-medium">City Lists</span>
                    <span className="font-bold text-slate-800">
                      {cityColumn ? cityGroups.length : 0}
                    </span>
                  </div>
                </div>

                {cityColumn && cityGroups.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-2">
                      Smart lists that will be created (by city)
                    </h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                          <tr>
                            <th className="p-2.5">City</th>
                            <th className="p-2.5 text-right">Leads</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cityGroups.map((g) => (
                            <tr key={g.label}>
                              <td className="p-2.5 font-medium text-slate-800 flex items-center gap-1.5">
                                <FaLocationDot className="text-[10px] text-blue-500" />
                                {g.label}
                              </td>
                              <td className="p-2.5 text-right text-slate-600">{g.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <label className="flex items-start space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600"
                    />
                    <span>
                      I confirm that all contacts in this list have provided explicit consent to
                      receive communications from my organization.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wizard Sticky Navigation Footer Bar */}
        <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => goToStep(step - 1)}
            disabled={step === 1}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={step === 2 && (!file || sheets.length === 0)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{step === 4 ? 'Confirm & Import Leads' : 'Next'}</span>
              {step === 4 ? (
                <FaCheck className="text-[10px]" />
              ) : (
                <FaChevronRight className="text-[10px]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportWizard;