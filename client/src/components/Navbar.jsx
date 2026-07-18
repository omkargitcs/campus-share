import React, { useState } from "react";
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  UserCircle,
  Search,
  Menu,
  X,
  PlusCircle,
} from "lucide-react";

const Navbar = ({ userEmail, onLogout, onUploadClick, onProfileClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo Branding */}
        <div className="text-xl font-black bg-gradient-to-r from-blue-500 to-emerald-400 bg-clip-text text-transparent tracking-wider select-none shrink-0">
          CAMPUS SHARE
        </div>

        {/* NEW: Desktop Central Search Engine Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search resources, notes, PYQs..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* Desktop Controls Menu */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onUploadClick}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/10"
          >
            <PlusCircle size={16} /> Upload Resource
          </button>

          {/* User Profile Context Menu */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-zinc-900 rounded-xl border border-transparent hover:border-zinc-800 transition"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm text-white">
                {userEmail ? userEmail[0].toUpperCase() : <User size={16} />}
              </div>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 mb-2 border-b border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    Account
                  </p>
                  <p className="text-sm text-zinc-200 truncate">{userEmail}</p>
                </div>

                <button
                  onClick={() => {
                    onProfileClick();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                >
                  <UserCircle size={16} /> My Profile
                </button>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition mt-1">
                  <Settings size={16} /> Account Settings
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition mt-1 border-t border-zinc-800/50 pt-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NEW: Mobile Hamburger Menu Toggle Trigger */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition border border-transparent hover:border-zinc-800"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* NEW: Mobile Expandable Accordion Menu Flyout */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-[#09090b] px-4 py-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Mobile Embedded Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search assets..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* Upload Button Call-To-Action */}
          <button
            onClick={() => {
              onUploadClick();
              setIsMobileMenuOpen(false);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <PlusCircle size={16} /> Upload Resource
          </button>

          {/* User Links Stack */}
          <div className="flex flex-col border-t border-zinc-800 pt-3 gap-1">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-3 mb-1">
              Active Session ({userEmail})
            </p>
            <button
              onClick={() => {
                onProfileClick();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 text-left transition"
            >
              <UserCircle size={18} /> My Profile
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 text-left transition">
              <Settings size={18} /> Account Settings
            </button>
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 rounded-xl hover:bg-red-500/10 text-left transition mt-2 border-t border-zinc-800/50 pt-3"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
