import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FaAlignCenter,
  FaAlignJustify,
  FaAlignLeft,
  FaAlignRight,
  FaBold,
  FaChevronDown,
  FaCode,
  FaEraser,
  FaFileCode,
  FaHighlighter,
  FaImage,
  FaIndent,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
  FaMinus,
  FaOutdent,
  FaQuoteLeft,
  FaRotateLeft,
  FaRotateRight,
  FaStrikethrough,
  FaSubscript,
  FaSuperscript,
  FaUnderline,
  FaXmark,
} from 'react-icons/fa6';

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Arial Black', value: '"Arial Black", Gadget, sans-serif' },
  { label: 'Arial Narrow', value: '"Arial Narrow", Arial, sans-serif' },
  { label: 'Baskerville', value: 'Baskerville, "Times New Roman", serif' },
  { label: 'Book Antiqua', value: '"Book Antiqua", Georgia, serif' },
  { label: 'Bookman', value: 'Bookman, Georgia, serif' },
  { label: 'Calibri', value: 'Calibri, Candara, Segoe, sans-serif' },
  { label: 'Cambria', value: 'Cambria, Georgia, serif' },
  { label: 'Candara', value: 'Candara, Calibri, sans-serif' },
  { label: 'Century Gothic', value: '"Century Gothic", sans-serif' },
  { label: 'Century Schoolbook', value: '"Century Schoolbook", Georgia, serif' },
  { label: 'Charcoal', value: 'Charcoal, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
  { label: 'Consolas', value: 'Consolas, "Courier New", monospace' },
  { label: 'Cooper Black', value: '"Cooper Black", "Book Antiqua", serif' },
  { label: 'Copperplate', value: 'Copperplate, "Copperplate Gothic Light", sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Didot', value: 'Didot, "Hoefler Text", serif' },
  { label: 'Droid Sans', value: '"Droid Sans", sans-serif' },
  { label: 'Droid Serif', value: '"Droid Serif", Georgia, serif' },
  { label: 'Franklin Gothic Medium', value: '"Franklin Gothic Medium", sans-serif' },
  { label: 'Futura', value: 'Futura, "Century Gothic", sans-serif' },
  { label: 'Garamond', value: 'Garamond, "Times New Roman", serif' },
  { label: 'Geneva', value: 'Geneva, Tahoma, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Gill Sans', value: '"Gill Sans", "Trebuchet MS", sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Hoefler Text', value: '"Hoefler Text", Baskerville, serif' },
  { label: 'Impact', value: 'Impact, Charcoal, sans-serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Lato', value: 'Lato, "Helvetica Neue", sans-serif' },
  { label: 'Lucida Bright', value: '"Lucida Bright", Georgia, serif' },
  { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
  { label: 'Lucida Handwriting', value: '"Lucida Handwriting", cursive' },
  { label: 'Lucida Sans', value: '"Lucida Sans", "Lucida Sans Unicode", sans-serif' },
  { label: 'Lucida Sans Unicode', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  { label: 'Marker Felt', value: '"Marker Felt", "Comic Sans MS", sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, "Helvetica Neue", sans-serif' },
  { label: 'MS Sans Serif', value: '"MS Sans Serif", Geneva, sans-serif' },
  { label: 'MS Serif', value: '"MS Serif", "New York", serif' },
  { label: 'Noto Sans', value: '"Noto Sans", sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", "Helvetica Neue", sans-serif' },
  { label: 'Optima', value: 'Optima, Candara, sans-serif' },
  { label: 'Palatino Linotype', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { label: 'Papyrus', value: 'Papyrus, fantasy' },
  { label: 'Perpetua', value: 'Perpetua, Georgia, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Poppins', value: 'Poppins, "Segoe UI", sans-serif' },
  { label: 'Roboto', value: 'Roboto, "Helvetica Neue", sans-serif' },
  { label: 'Rockwell', value: 'Rockwell, "Courier New", serif' },
  { label: 'Segoe Print', value: '"Segoe Print", "Bradley Hand", cursive' },
  { label: 'Segoe Script', value: '"Segoe Script", cursive' },
  { label: 'Segoe UI', value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
  { label: 'Ubuntu', value: 'Ubuntu, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Webdings', value: 'Webdings, sans-serif' },
  { label: 'Wingdings', value: 'Wingdings, "Zapf Dingbats", sans-serif' },
];

const FONT_SIZES = Array.from({ length: 72 }, (_, i) => i + 1);

const PARAGRAPH_FORMATS: { label: string; value: string }[] = [
  { label: 'Paragraph', value: 'p' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'Heading 4', value: 'h4' },
  { label: 'Heading 5', value: 'h5' },
  { label: 'Heading 6', value: 'h6' },
  { label: 'Div', value: 'div' },
  { label: 'Preformatted', value: 'pre' },
  { label: 'Blockquote', value: 'blockquote' },
];

const LINE_HEIGHTS = ['1.0', '1.15', '1.5', '2.0', '2.5', '3.0'];

const BLOCK_TAGS = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'LI', 'UL', 'OL'];

const COLOR_SWATCHES = [
  '#000000', '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0',
  '#F8FAFC', '#FFFFFF', '#FEF3C7', '#FDE047', '#FACC15', '#F97316', '#EA580C', '#EF4444',
  '#DC2626', '#B91C1C', '#F472B6', '#EC4899', '#D946EF', '#A855F7', '#8B5CF6', '#6366F1',
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#06B6D4', '#0EA5E9', '#0284C7', '#10B981',
  '#22C55E', '#16A34A', '#15803D', '#84CC16', '#65A30D', '#EAB308', '#A16207', '#78350F',
];

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxLength?: number;
  className?: string;
}

/** Attractive, brand-styled popup rendered in a portal (never clipped by drawers). */
function EditorPopup({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-80 max-w-full bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden animate-pop">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50">
          <h3 className="text-sm font-bold text-slate-700">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition"
            title="Close"
          >
            <FaXmark />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  minHeight = 120,
  maxLength,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const lastValue = useRef(value);

  const [sourceMode, setSourceMode] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState('');
  const [customSize, setCustomSize] = useState('');

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeDraft, setCodeDraft] = useState('');
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [hiliteOpen, setHiliteOpen] = useState(false);
  const [colorHex, setColorHex] = useState('#2563EB');

  // Push external value changes (e.g. reset after send) into the editor.
  useEffect(() => {
    if (lastValue.current === value) return;
    lastValue.current = value;
    if (editorRef.current && !sourceMode) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, sourceMode]);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    const html = editorRef.current?.innerHTML ?? '';
    lastValue.current = html;
    onChange(html);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  /** Focus the editor and replay the last saved selection before running a command. */
  const applyWithSelection = (fn: () => void) => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      if (savedRange.current) sel.addRange(savedRange.current);
    }
    try {
      fn();
    } finally {
      sync();
    }
  };

  const exec = (cmd: string, cmdValue?: string) =>
    applyWithSelection(() => document.execCommand(cmd, false, cmdValue));

  const applyFontName = (family: string) => exec('fontName', family);

  const applyFontSize = (px: number) => {
    applyWithSelection(() => {
      // Use the largest HTML size so the browser creates <font size="7">,
      // then swap it for a span with the exact pixel size.
      document.execCommand('fontSize', false, '7');
      const fonts = Array.from(editorRef.current?.querySelectorAll('font[size="7"]') ?? []);
      fonts.forEach((f) => {
        const span = document.createElement('span');
        span.style.fontSize = `${px}px`;
        while (f.firstChild) span.appendChild(f.firstChild);
        f.replaceWith(span);
      });
    });
  };

  const applyLineHeight = (val: string) => {
    applyWithSelection(() => {
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      let el: HTMLElement | null =
        node && node.nodeType === 1 ? (node as HTMLElement) : (node?.parentElement ?? null);
      while (el && !BLOCK_TAGS.includes(el.tagName)) el = el.parentElement;
      if (el) el.style.lineHeight = val;
    });
  };

  const openLink = () => {
    saveSelection();
    setLinkUrl('https://');
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    applyWithSelection(() => {
      document.execCommand('createLink', false, url);
      const sel = window.getSelection();
      if (sel) {
        for (let i = 0; i < sel.rangeCount; i++) {
          const anchor = sel.getRangeAt(i).startContainer.parentElement;
          if (anchor && anchor.tagName === 'A') anchor.setAttribute('target', '_blank');
        }
      }
    });
    setLinkOpen(false);
  };

  const openCode = () => {
    saveSelection();
    setCodeDraft('');
    setCodeOpen(true);
  };

  const applyCode = () => {
    if (!codeDraft) return;
    applyWithSelection(() => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        document.execCommand('delete');
      }
      const pre = document.createElement('pre');
      pre.className = 'rte-code-block';
      const codeEl = document.createElement('code');
      codeEl.textContent = codeDraft;
      pre.appendChild(codeEl);
      const ed = editorRef.current;
      if (!ed) return;
      ed.appendChild(document.createElement('br'));
      ed.appendChild(pre);
      ed.appendChild(document.createElement('br'));
    });
    setCodeOpen(false);
  };

  const openColor = (kind: 'text' | 'highlight') => {
    saveSelection();
    setColorHex('#2563EB');
    if (kind === 'text') setTextColorOpen(true);
    else setHiliteOpen(true);
  };

  const applyColor = (hexValue: string) => {
    const hex = hexValue.trim();
    if (!HEX_RE.test(hex)) return;
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    applyWithSelection(() => document.execCommand(textColorOpen ? 'foreColor' : 'hiliteColor', false, normalized));
    setTextColorOpen(false);
    setHiliteOpen(false);
  };

  const applyCustomSize = () => {
    const px = Number(customSize);
    if (!Number.isFinite(px) || px <= 0) return;
    applyFontSize(px);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      saveSelection();
      applyWithSelection(() => document.execCommand('insertImage', false, String(reader.result)));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleSource = () => {
    if (!sourceMode) {
      setHtmlDraft(editorRef.current?.innerHTML ?? value);
      setSourceMode(true);
    } else {
      if (editorRef.current) editorRef.current.innerHTML = htmlDraft;
      sync();
      setSourceMode(false);
    }
  };

  const handleInput = () => {
    const ed = editorRef.current;
    if (!ed) return;
    if (maxLength && ed.innerText.length > maxLength) {
      ed.innerText = ed.innerText.slice(0, maxLength);
    }
    sync();
  };

  const btn =
    'w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-700 text-xs transition flex-shrink-0 active:scale-90';
  const selCls =
    'h-7 bg-white border border-slate-200 rounded-lg pl-1 pr-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer';

  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="relative z-10 bg-slate-50 border-b border-slate-200 px-1.5 py-1 flex flex-wrap items-center gap-0.5 select-none max-h-24 overflow-y-auto">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('undo'); }} className={btn} title="Undo">
          <FaRotateLeft className="text-[11px]" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('redo'); }} className={btn} title="Redo">
          <FaRotateRight className="text-[11px]" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <select
          onMouseDown={saveSelection}
          onChange={(e) => applyFontName(e.target.value)}
          className={`${selCls} max-w-[130px]`}
          defaultValue=""
          title="Font family"
        >
          <option value="" disabled>
            Font
          </option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          onMouseDown={saveSelection}
          onChange={(e) => applyFontSize(Number(e.target.value))}
          className={selCls}
          defaultValue=""
          title="Font size (1-72)"
        >
          <option value="" disabled>
            Size
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} px
            </option>
          ))}
        </select>

        <span className="relative inline-flex items-center">
          <input
            type="number"
            min={1}
            max={200}
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyCustomSize();
                e.currentTarget.select();
              }
            }}
            onBlur={applyCustomSize}
            placeholder="Custom"
            title="Custom font size (1-72+)"
            className="h-7 w-14 bg-white border border-slate-200 rounded-lg px-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-400"
          />
        </span>

        <select
          onMouseDown={saveSelection}
          onChange={(e) => exec('formatBlock', `<${e.target.value}>`)}
          className={selCls}
          defaultValue=""
          title="Paragraph style"
        >
          <option value="" disabled>
            Paragraph
          </option>
          {PARAGRAPH_FORMATS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          onMouseDown={saveSelection}
          onChange={(e) => applyLineHeight(e.target.value)}
          className={selCls}
          defaultValue=""
          title="Line spacing"
        >
          <option value="" disabled>
            Line
          </option>
          {LINE_HEIGHTS.map((lh) => (
            <option key={lh} value={lh}>
              {lh}
            </option>
          ))}
        </select>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className={btn} title="Bold">
          <FaBold className="text-xs" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className={btn} title="Italic">
          <FaItalic className="text-xs" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className={btn} title="Underline">
          <FaUnderline className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('strikeThrough'); }}
          className={btn}
          title="Strikethrough"
        >
          <FaStrikethrough className="text-xs" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('subscript'); }} className={btn} title="Subscript">
          <FaSubscript className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('superscript'); }}
          className={btn}
          title="Superscript"
        >
          <FaSuperscript className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}
          className={btn}
          title="Clear formatting"
        >
          <FaEraser className="text-xs" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openColor('text')}
          className={`${btn} font-bold`}
          title="Text color"
        >
          <span className="text-[10px] leading-none">
            A<span className="block text-[7px] leading-none text-blue-600">color</span>
          </span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openColor('highlight')}
          className={btn}
          title="Highlight color"
        >
          <FaHighlighter className="text-xs" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }}
          className={btn}
          title="Bulleted list"
        >
          <FaListUl className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}
          className={btn}
          title="Numbered list"
        >
          <FaListOl className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<blockquote>'); }}
          className={btn}
          title="Quote"
        >
          <FaQuoteLeft className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<pre>'); }}
          className={btn}
          title="Code block"
        >
          <FaCode className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openCode}
          className={btn}
          title="Code embed"
        >
          <FaFileCode className="text-xs" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}
          className={btn}
          title="Align left"
        >
          <FaAlignLeft className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}
          className={btn}
          title="Align center"
        >
          <FaAlignCenter className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}
          className={btn}
          title="Align right"
        >
          <FaAlignRight className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }}
          className={btn}
          title="Justify"
        >
          <FaAlignJustify className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('outdent'); }}
          className={btn}
          title="Decrease indent"
        >
          <FaOutdent className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('indent'); }}
          className={btn}
          title="Increase indent"
        >
          <FaIndent className="text-xs" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLink}
          className={btn}
          title="Insert link"
        >
          <FaLink className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click(); }}
          className={btn}
          title="Insert image"
        >
          <FaImage className="text-xs" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec('insertHorizontalRule'); }}
          className={btn}
          title="Horizontal line"
        >
          <FaMinus className="text-xs" />
        </button>

        <span className="w-px h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={toggleSource}
          className={`${btn} ${sourceMode ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
          title={sourceMode ? 'Back to visual editor' : 'Edit HTML source'}
        >
          <FaFileCode className="text-xs" />
        </button>
        <FaChevronDown className="text-slate-300 text-[8px] ml-auto flex-shrink-0" />
      </div>

      {/* Body */}
      {sourceMode ? (
        <textarea
          value={htmlDraft}
          onChange={(e) => setHtmlDraft(e.target.value)}
          className="w-full p-3 text-xs font-mono text-slate-800 focus:outline-none resize-y"
          rows={8}
          spellCheck={false}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onFocus={saveSelection}
          data-placeholder={placeholder}
          className="composer-editor w-full px-3 py-2 text-xs text-slate-800 focus:outline-none overflow-y-auto"
          style={{ minHeight }}
        />
      )}

      {maxLength && (
        <div className="px-3 py-1.5 text-[10px] text-slate-400 text-right border-t border-slate-100 bg-white">
          {sourceMode ? htmlDraft.length : editorRef.current?.innerText.length ?? 0} / {maxLength} characters
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

      {/* Custom popups (no browser dialogs) */}
      <EditorPopup open={linkOpen} title="Insert Link" onClose={() => setLinkOpen(false)}>
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://example.com"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <p className="text-[10px] text-slate-400">Opens in a new tab</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLinkOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyLink}
              disabled={!linkUrl.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition"
            >
              Apply
            </button>
          </div>
        </div>
      </EditorPopup>

      <EditorPopup open={codeOpen} title="Embed Code" onClose={() => setCodeOpen(false)}>
        <div className="flex flex-col gap-3">
          <textarea
            autoFocus
            value={codeDraft}
            onChange={(e) => setCodeDraft(e.target.value)}
            rows={5}
            spellCheck={false}
            placeholder="Paste your code snippet..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCodeOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyCode}
              disabled={!codeDraft.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition"
            >
              Insert
            </button>
          </div>
        </div>
      </EditorPopup>

      <EditorPopup open={textColorOpen} title="Text Color" onClose={() => setTextColorOpen(false)}>
        <ColorPicker value={colorHex} onChange={setColorHex} onApply={applyColor} onClose={() => setTextColorOpen(false)} />
      </EditorPopup>

      <EditorPopup open={hiliteOpen} title="Highlight Color" onClose={() => setHiliteOpen(false)}>
        <ColorPicker value={colorHex} onChange={setColorHex} onApply={applyColor} onClose={() => setHiliteOpen(false)} />
      </EditorPopup>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
  onApply,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onApply: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-8 gap-1.5">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onApply(c)}
            className={`h-7 rounded-md border transition hover:scale-110 active:scale-95 ${
              value.toLowerCase() === c.toLowerCase() ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="flex-shrink-0 w-8 h-8 rounded-lg border border-slate-200 shadow-inner"
          style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onApply(value);
            }
          }}
          placeholder="#000000"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 uppercase"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onApply(value)}
          disabled={!HEX_RE.test(value)}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export default RichTextEditor;