import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import {
  LogOut,
  Settings,
  ChevronDown,
  UserCircle,
  Search,
  Menu,
  X,
  PlusCircle,
  Users,
  GraduationCap,
  Library,
} from "lucide-react";
import ProfileSidebar from "./ProfileSidebar";
import SettingsModal from "./SettingsModal";
import NotificationBell from "./NotificationBell";
import { useUser } from "../utils/UserContext";
import { logout } from "../utils/auth";

// Search box and Upload button only appear on pages that pass the props (the Dashboard).
const Navbar = ({ searchTerm, setSearchTerm, onUploadClick }) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const email = user?.email || "";
  const name = email ? email.split("@")[0] : "Account";
  const initial = name.charAt(0).toUpperCase();
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const hasSearch = typeof setSearchTerm === "function";

  // "/" focuses search (like GitHub/YouTube), Esc inside it clears
  useEffect(() => {
    if (!hasSearch) return;
    const onKey = (e) => {
      const tag = e.target.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hasSearch]);

  // close user menu on outside click
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
      isActive ? "text-white bg-zinc-900" : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
    }`;

  const searchInput = (extraClass, placeholder, inputRef) => (
    <div className={`relative ${extraClass}`}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
      <input
        ref={inputRef}
        type="text"
        value={searchTerm || ""}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSearchTerm("");
            e.target.blur();
          }
        }}
        placeholder={placeholder}
        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-12 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
      />
      {searchTerm ? (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          Clear
        </button>
      ) : (
        inputRef && (
          <kbd className="hidden lg:block absolute right-3 top-2 text-[10px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
            /
          </kbd>
        )
      )}
    </div>
  );

  return (
    <>
      <nav className="border-b border-zinc-900 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/dashboard"
              className="text-xl font-black bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 bg-clip-text text-transparent tracking-wider select-none"
            >
              CAMPUS SHARE
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" className={linkClass}>
                <Library size={15} /> Library
              </NavLink>
              <NavLink to="/teams" className={linkClass}>
                <Users size={15} /> Teams
              </NavLink>
              {isTeacher && (
                <NavLink to="/teacher" className={linkClass}>
                  <GraduationCap size={15} /> Teacher
                </NavLink>
              )}
            </div>
          </div>

          {hasSearch && searchInput("hidden md:flex flex-1 max-w-md", "Search resources, notes, PYQs...", searchRef)}
          {!hasSearch && <div className="flex-1" />}

          <div className="flex items-center gap-2 sm:gap-3">
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95"
              >
                <PlusCircle size={16} /> Upload
              </button>
            )}

            <NotificationBell />

            <div className="relative hidden md:block" ref={menuRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-zinc-900 rounded-xl border border-transparent hover:border-zinc-800 transition focus:outline-none"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-inner uppercase">
                  {initial}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-20">
                  <div className="px-3 py-2 mb-2 border-b border-zinc-900">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Account</p>
                      {user?.role && (
                        <span className="text-[9px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-black border border-blue-600/30">
                          {user.role}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-200 truncate font-medium mt-1">{name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setProfileOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition text-left"
                  >
                    <UserCircle size={16} /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition mt-1 text-left"
                  >
                    <Settings size={16} /> Account Settings
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition mt-1 border-t border-zinc-900 pt-2 text-left"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition border border-transparent hover:border-zinc-800 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-[#09090b] px-4 py-4 flex flex-col gap-3">
            {hasSearch && searchInput("w-full", "Search assets...", null)}

            {onUploadClick && (
              <button
                onClick={() => {
                  onUploadClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <PlusCircle size={16} /> Upload Resource
              </button>
            )}

            <div className="flex flex-col border-t border-zinc-900 pt-3 gap-1">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-3 mb-1 truncate">
                {email || "Signed in"}
              </p>
              <NavLink to="/dashboard" className={linkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Library size={16} /> Library
              </NavLink>
              <NavLink to="/teams" className={linkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Users size={16} /> Teams
              </NavLink>
              {isTeacher && (
                <NavLink to="/teacher" className={linkClass} onClick={() => setIsMobileMenuOpen(false)}>
                  <GraduationCap size={16} /> Teacher
                </NavLink>
              )}
              <button
                onClick={() => {
                  setProfileOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 text-left transition"
              >
                <UserCircle size={18} /> My Profile
              </button>
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 text-left transition"
              >
                <Settings size={18} /> Account Settings
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 rounded-xl hover:bg-red-500/10 text-left transition mt-2 border-t border-zinc-900 pt-3"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Portaled to <body>: the nav's backdrop-blur would otherwise trap these fixed overlays inside the navbar box */}
      {createPortal(
        <>
          <ProfileSidebar isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
          <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
        </>,
        document.body,
      )}
    </>
  );
};

export default Navbar;
