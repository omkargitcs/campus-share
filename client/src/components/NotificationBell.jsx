import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import API from "../api";
import { timeAgo } from "../utils/format";

const NotificationBell = () => {
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
      // silent: the bell is a nice-to-have, never block the page on it
    }
  }, []);

  // initial load + poll every minute + refresh when the tab regains focus
  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl border border-transparent hover:border-zinc-800 transition focus:outline-none"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Notifications
            </p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-600">
                You're all caught up.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markOne(n)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-900/60 last:border-0 hover:bg-zinc-900/60 transition flex gap-3 ${
                    n.isRead ? "opacity-60" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      n.isRead ? "bg-transparent" : "bg-blue-500"
                    }`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-zinc-200 leading-snug">{n.message}</span>
                    <span className="block text-[11px] text-zinc-600 mt-1">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
