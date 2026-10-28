import React, { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, Link } from "react-router-dom";
import { Library, Users, GraduationCap } from "lucide-react";
import CampusShareLogo from "./CampusShareLogo";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import AccountMenu from "./AccountMenu";
import ProfileSidebar from "./ProfileSidebar";
import SettingsModal from "./SettingsModal";
import { useUser } from "../utils/UserContext";

// Desktop: fixed left sidebar. Phone: slim top bar + bottom tab bar.
const AppShell = ({ children, wide = false }) => {
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  const items = [
    { to: "/dashboard", label: "Library", icon: Library },
    { to: "/teams", label: "Teams", icon: Users },
    ...(isTeacher ? [{ to: "/teacher", label: "Teacher", icon: GraduationCap }] : []),
  ];

  const railLink = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
      isActive ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
    }`;
  const tabLink = ({ isActive }) =>
    `flex flex-col items-center gap-1 py-2.5 text-xs font-semibold transition ${isActive ? "text-white" : "text-white/65"}`;

  return (
    <div className="min-h-dvh md:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-rail px-3 py-5 text-white md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2.5 px-3">
          <CampusShareLogo className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-tight">Campus Share</span>
        </Link>

        <nav aria-label="Main" className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={railLink}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3">
          <ThemeToggle variant="rail" />
          <NotificationBell variant="rail" />
          <AccountMenu variant="rail" onProfile={() => setProfileOpen(true)} onSettings={() => setSettingsOpen(true)} />
        </div>
      </aside>

      {/* phone top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-rail px-4 pt-[env(safe-area-inset-top)] text-white md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <CampusShareLogo className="h-7 w-7" />
          <span className="font-display text-lg font-bold tracking-tight">Campus Share</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="!text-white/80 hover:!bg-white/10 hover:!text-white" />
          <NotificationBell variant="top" />
        </div>
      </header>

      <main className={`mx-auto px-4 pb-32 pt-7 md:px-10 md:pb-16 md:pt-12 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>{children}</main>

      {/* phone tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-rail pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className={`grid ${isTeacher ? "grid-cols-4" : "grid-cols-3"}`}>
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={tabLink}>
              <Icon size={22} /> {label}
            </NavLink>
          ))}
          <AccountMenu variant="tab" onProfile={() => setProfileOpen(true)} onSettings={() => setSettingsOpen(true)} />
        </div>
      </nav>

      {createPortal(
        <>
          <ProfileSidebar isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
          {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        </>,
        document.body,
      )}
    </div>
  );
};

export default AppShell;
