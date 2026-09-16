import { useRef, useState } from 'react';
import {
  FaArrowUpFromBracket,
  FaCloudArrowUp,
  FaFileCirclePlus,
  FaFilePdf,
  FaFileWord,
  FaRegFileLines,
  FaRegTrashCan,
  FaXmark,
} from 'react-icons/fa6';

const MAX_FILES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface UploadDocumentsModalProps {
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

interface PendingFile {
  id: number;
  file: File;
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext)) return <FaFilePdf className="text-red-500" />;
  if (['doc', 'docx'].includes(ext)) return <FaFileWord className="text-blue-600" />;
  return <FaRegFileLines className="text-slate-500" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDocumentsModal({ onClose, onUpload }: UploadDocumentsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [overflow, setOverflow] = useState(false);
  const [tooLarge, setTooLarge] = useState<string[]>([]);

  const addFiles = (incoming: File[]) => {
    const oversized = incoming.filter((f) => f.size > MAX_FILE_BYTES);
    setTooLarge(oversized.map((f) => f.name));
    const within = incoming.filter((f) => f.size <= MAX_FILE_BYTES);
    const room = MAX_FILES - pending.length;
    setOverflow(within.length > room);
    const accepted = within.slice(0, Math.max(0, room));
    if (accepted.length === 0) return;
    let counter = pending.length;
    setPending((prev) => [
      ...prev,
      ...accepted.map((file) => ({ id: counter++, file })),
    ]);
  };

  const chooseFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: number) => {
    setPending((prev) => prev.filter((f) => f.id !== id));
    setOverflow(false);
  };

  const submit = () => {
    if (pending.length === 0) return;
    onUpload(pending.map((f) => f.file));
  };

  const remaining = MAX_FILES - pending.length;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white w-[560px] max-w-[94vw] max-h-[90vh] rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FaArrowUpFromBracket className="text-sm" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Upload documents</h2>
              <p className="text-[11px] text-slate-500">Add files to this contact</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <FaXmark className="text-base" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <span className="text-[11px] text-slate-500">
              Up to <strong className="text-slate-800">{MAX_FILES} documents</strong>, max{' '}
              <strong className="text-slate-800">10 MB</strong> each
            </span>
            <span className={`text-[11px] font-semibold ${remaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {pending.length} / {MAX_FILES} selected
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(Array.from(e.dataTransfer.files ?? []));
            }}
            className={`rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 py-10 cursor-pointer ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : remaining === 0
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/40'
            }`}
            onClick={() => remaining > 0 && fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <FaCloudArrowUp className="text-lg" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {dragOver ? 'Drop files to upload' : 'Drag & drop files here'}
            </p>
            <p className="text-[11px] text-slate-400">
              or{' '}
              <span className="text-blue-600 font-semibold underline underline-offset-2">
                browse from your computer
              </span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={chooseFiles}
            />
          </div>

          {overflow && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-[11px]">
              <FaFileCirclePlus className="mt-0.5 flex-shrink-0" />
              <span>
                Maximum {MAX_FILES} documents allowed. Only the first {remaining} file
                {remaining === 1 ? '' : 's'} of your selection {remaining === 1 ? 'was' : 'were'} added.
              </span>
            </div>
          )}

          {tooLarge.length > 0 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-[11px]">
              <FaFileCirclePlus className="mt-0.5 flex-shrink-0" />
              <span>
                These files exceed the 10 MB limit and were not added: {tooLarge.join(', ')}
              </span>
            </div>
          )}

          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-600">Selected files</p>
              {pending.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                    {fileIcon(f.file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{f.file.name}</p>
                    <p className="text-[10px] text-slate-400">{formatSize(f.file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                    title="Remove file"
                  >
                    <FaRegTrashCan className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending.length === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Upload {pending.length > 0 ? `${pending.length} file${pending.length === 1 ? '' : 's'}` : ''}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default UploadDocumentsModal;