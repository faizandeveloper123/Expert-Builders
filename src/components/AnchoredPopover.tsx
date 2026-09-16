import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export type AnchoredPlacement = 'bottom-start' | 'bottom-end' | 'bottom-center';

interface AnchoredPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  placement?: AnchoredPlacement;
  width?: number;
  matchAnchorWidth?: boolean;
  offset?: number;
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const EDGE = 8;

export default function AnchoredPopover({
  anchorEl,
  open,
  onClose,
  placement = 'bottom-end',
  width,
  matchAnchorWidth = false,
  offset = 6,
  zIndex = 70,
  className = '',
  style,
  children,
}: AnchoredPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const update = useCallback(() => {
    if (!anchorEl || !open) return;
    const r = anchorEl.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let w = width ?? (matchAnchorWidth ? r.width : panelRef.current?.offsetWidth ?? 224);
    if (matchAnchorWidth && width) w = Math.max(w, r.width);
    w = Math.min(w, vw - EDGE * 2);
    let left =
      placement === 'bottom-end'
        ? r.right - w
        : placement === 'bottom-start'
          ? r.left
          : r.left + r.width / 2 - w / 2;
    left = Math.min(Math.max(EDGE, left), Math.max(EDGE, vw - w - EDGE));
    const ph = panelRef.current?.offsetHeight ?? 0;
    let top = r.bottom + offset;
    if (ph > 0 && top + ph > vh - EDGE && r.top - offset - ph >= EDGE) {
      top = r.top - offset - ph;
    }
    if (ph > 0 && top + ph > vh - EDGE) {
      top = Math.max(EDGE, vh - EDGE - ph);
    }
    // Keep the panel pinned inside the viewport when the anchor scrolls away,
    // instead of letting it drift off-screen and vanish.
    if (top < EDGE) top = EDGE;
    setPos((prev) =>
      prev && prev.top === top && prev.left === left && prev.width === w ? prev : { top, left, width: w }
    );
  }, [anchorEl, open, placement, width, matchAnchorWidth, offset]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    update();
  }, [open, update]);

  useEffect(() => {
    if (!open || !anchorEl) return;
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (ro && panelRef.current) ro.observe(panelRef.current);
    const onOutsideClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (t === document.documentElement || t === document.body) return;
      if (panelRef.current?.contains(t) || anchorEl.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('click', onOutsideClick, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      document.removeEventListener('click', onOutsideClick, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [open, anchorEl, onClose, update]);

  if (!open || !anchorEl) return null;

  const fallbackWidth = width ?? (matchAnchorWidth ? anchorEl.offsetWidth : undefined);

  return createPortal(
    <div
      ref={panelRef}
      className={`fixed z-[70] ${className}`}
      style={{
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : EDGE,
        width: pos ? pos.width : fallbackWidth,
        visibility: pos ? 'visible' : 'hidden',
        zIndex,
        ...style,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
