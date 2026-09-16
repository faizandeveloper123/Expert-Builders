import { useCallback, useEffect, useRef, useState } from 'react';
import { FaBell, FaRegBell, FaCheckDouble, FaRegUser, FaComments, FaEnvelope } from 'react-icons/fa6';
import { useAuth } from '../auth';
import { api, type ApiNotification } from '../api';
import { navigate } from '../router';
import AnchoredPopover from './AnchoredPopover';

interface NotificationsBellProps {
  onNotify?: (msg: string) => void;
}

const POLL_MS = 30000;

const TYPE_ICON: Record<string, React.ReactNode> = {
  lead_assigned: <FaRegUser className="text-[11px]" />,
  follower_added: <FaRegUser className="text-[11px]" />,
  mention: <FaComments className="text-[11px]" />,
  message: <FaEnvelope className="text-[11px]" />,
};

function timeAgo(value: string): string {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function requestBrowserPermission(onNotify: (msg: string) => void): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission()
      .then((p) => {
        if (p === 'granted') onNotify('Browser notifications enabled');
      })
      .catch(() => undefined);
  }
}

/**
 * Notification bell shown in the top bar. Polls the API for the signed-in
 * user's unread count, opens a dropdown of recent notifications, and can
 * fire browser notifications when new items arrive.
 */
function NotificationsBell({ onNotify }: NotificationsBellProps) {
  const { user } = useAuth();
  const staffId = user?.id ?? 0;

  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const lastKnownUnread = useRef<number | null>(null);
  const firstPoll = useRef(true);
  const bellBtnRef = useRef<HTMLButtonElement>(null);

  const refreshCount = useCallback(async () => {
    if (!staffId) return;
    try {
      const res = await api.unreadCount(staffId);
      const count = res.data.unread;
      setUnread(count);

      if (firstPoll.current) {
        firstPoll.current = false;
        lastKnownUnread.current = count;
        return;
      }
      if (count > (lastKnownUnread.current ?? 0) && count > 0) {
        try {
          const list = await api.listNotifications(staffId, true);
          const newest = list.data[0];
          if (newest && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(newest.title, {
              body: newest.detail || `Regarding ${newest.contact_name ?? 'a contact'}`,
              tag: `evee-notif-${newest.id}`,
              icon: '/logo.svg',
            });
          }
        } catch {
          /* browser notification is best-effort */
        }
      }
      lastKnownUnread.current = count;
    } catch {
      /* keep the current badge */
    }
  }, [staffId]);

  useEffect(() => {
    void refreshCount();
    const timer = window.setInterval(() => void refreshCount(), POLL_MS);
    const onFocus = () => void refreshCount();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshCount]);

  // Keep the dropdown pinned to the bell on scroll/resize instead of closing,
  // so it stays open and usable while the page behind it scrolls.
  const openDropdown = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      requestBrowserPermission(onNotify ?? (() => undefined));
      setLoadingList(true);
      try {
        const res = await api.listNotifications(staffId);
        setItems(res.data);
      } catch {
        setItems([]);
      } finally {
        setLoadingList(false);
      }
    }
  };

  const handleOpenItem = async (n: ApiNotification) => {
    if (n.is_read === 0) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)));
      setUnread((u) => Math.max(0, u - 1));
      try {
        await api.markNotificationRead(n.id);
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (n.contact_id) navigate({ name: 'contact', id: n.contact_id });
  };

  const markAllRead = async () => {
    if (!staffId) return;
    setItems((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
    setUnread(0);
    try {
      await api.markAllNotificationsRead(staffId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        ref={bellBtnRef}
        onClick={() => void openDropdown()}
        className="relative w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-sm transition flex-shrink-0"
        aria-label={`Notifications (${unread} unread)`}
      >
        {unread > 0 ? <FaBell className="text-sm" /> : <FaRegBell className="text-sm" />}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <AnchoredPopover
        open={open}
        anchorEl={bellBtnRef.current}
        onClose={() => setOpen(false)}
        placement="bottom-end"
        width={384}
        offset={8}
        className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden evee-pop"
      >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                <FaCheckDouble className="text-[10px]" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loadingList ? (
              <div className="py-10 text-center text-xs text-slate-400">Loading notifications…</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <FaRegBell className="mx-auto text-2xl text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 font-medium">You're all caught up</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Assignments and mentions will appear here.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => void handleOpenItem(n)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-50 transition hover:bg-slate-50 ${
                    n.is_read === 0 ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                      n.type === 'mention' || n.type === 'message'
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {TYPE_ICON[n.type] ?? <FaBell className="text-[11px]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    {n.detail && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.detail}</p>
                    )}
                    {n.contact_name && (
                      <p className="text-[10px] text-blue-600 font-medium mt-0.5">Open: {n.contact_name}</p>
                    )}
                  </div>
                  {n.is_read === 0 && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {user?.first_name ? `${user.first_name} ${user.last_name ?? ''}` : ''}
            </span>
            <button
              onClick={() => void openDropdown()}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
      </AnchoredPopover>
    </div>
  );
}

export default NotificationsBell;