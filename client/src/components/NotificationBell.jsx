import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import API from "../api";
import { timeAgo } from "../utils/format";

// variant: "rail" = labelled row in the desktop sidebar (panel opens to its right)
//          "top"  = icon button in the phone header (panel opens under the header)
const NotificationBell = ({ variant = "rail" }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await API.get("/notifications");
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      // silent: notifications must never block the page
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 60000);
    window.addEventListener("focus", load);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markOne = async (n) => {
    if (n.isRead) return;
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await API.patch(`/notifications/${n.id}/read`);
    } catch {
      load();
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnread(0);
    try {
      await API.patch("/notifications/read-all");
    } catch {
      load();
    }
  };

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) load();
  };
  const label = `Notifications${unread ? `, ${unread} unread` : ""}`;
  const badge =
    unread > 0 ? (
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ffe24a] px-1.5 text-[11px] font-bold text-[#0b1430]">
        {unread > 9 ? "9+" : unread}
      </span>
    ) : null;

  const panelPos =
    variant === "rail"
      ? "absolute bottom-0 left-full ml-3 w-[22rem]"
      : "fixed left-3 right-3 top-[calc(3.5rem+env(safe-area-inset-top))]";

  return (
    <div className="relative" ref={ref}>
      {variant === "rail" ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <Bell size={18} />
          <span className="flex-1 text-left">Notifications</span>
          {badge}
        </button>
      ) : (
        <button type="button" onClick={toggle} aria-label={label} aria-expanded={open} className="icon-btn relative !text-white/80 hover:!bg-white/10 hover:!text-white">
          <Bell size={18} />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#ffe24a] ring-2 ring-rail" />}
        </button>
      )}

      {open && (
        <div className={`modal-in z-50 overflow-hidden rounded-lg border border-line bg-surface text-fg shadow-2xl ${panelPos}`}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-base font-semibold">Notifications</h2>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="flex items-center gap-1.5 text-sm font-medium text-link hover:underline">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[min(24rem,60dvh)] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">You're all caught up.</p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id} className="border-b border-line last:border-0">
                    <button type="button" onClick={() => markOne(n)} className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-sunk">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent ring-1 ring-line" : "bg-accent"}`} />
                      <span className={`min-w-0 flex-1 ${n.isRead ? "text-muted" : ""}`}>
                        <span className="block text-sm leading-snug">{n.message}</span>
                        <span className="mt-1 block text-xs text-muted">{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
