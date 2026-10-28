import React, { useEffect, useRef, useState } from "react";
import { LogOut, Settings, UserCircle, ChevronsUpDown } from "lucide-react";
import { useUser } from "../utils/UserContext";
import { logout } from "../utils/auth";

const roleLabel = { STUDENT: "Student", TEACHER: "Teacher", ADMIN: "Admin" };

// variant: "rail" (account row at the bottom of the sidebar) | "tab" (tab in the phone bar)
const AccountMenu = ({ variant = "rail", onProfile, onSettings }) => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const email = user?.email || "";
  const name = email ? email.split("@")[0] : "Account";
  const initial = name.charAt(0).toUpperCase();

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

  const pick = (fn) => () => {
    setOpen(false);
    fn();
  };

  const menuPos =
    variant === "rail"
      ? "absolute bottom-full left-0 right-0 mb-2"
      : "fixed right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] w-64";

  const itemClass = "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition hover:bg-sunk";

  return (
    <div className="relative" ref={ref}>
      {variant === "rail" ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-white/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cobalt text-sm font-bold text-white">{initial}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{name}</span>
            <span className="block truncate text-xs text-white/60">{roleLabel[user?.role] || "Account"}</span>
          </span>
          <ChevronsUpDown size={14} className="shrink-0 text-white/50" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={`flex w-full flex-col items-center gap-1 py-2.5 text-xs font-semibold ${open ? "text-white" : "text-white/65"}`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-cobalt text-[11px] font-bold text-white">{initial}</span>
          Account
        </button>
      )}

      {open && (
        <div role="menu" className={`modal-in z-50 rounded-lg border border-line bg-surface p-1.5 text-fg shadow-2xl ${menuPos}`}>
          <div className="border-b border-line px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <div className="pt-1.5">
            <button type="button" role="menuitem" onClick={pick(onProfile)} className={itemClass}>
              <UserCircle size={17} className="text-muted" /> My profile
            </button>
            <button type="button" role="menuitem" onClick={pick(onSettings)} className={itemClass}>
              <Settings size={17} className="text-muted" /> Account settings
            </button>
            <button type="button" role="menuitem" onClick={logout} className={`${itemClass} text-danger`}>
              <LogOut size={17} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
