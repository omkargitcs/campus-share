import React, { useState } from "react";
import { User, LogOut, Settings, FolderHeart, ChevronDown } from "lucide-react";

const Navbar = ({ userEmail, onLogout, onUploadClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="text-xl font-black bg-gradient-to-r from-blue-500 to-emerald-400 bg-clip-text text-transparent">
          CAMPUS SHARE
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={onUploadClick}
            className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition"
          >
            + Upload Resource
          </button>

          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-zinc-900 rounded-xl border border-transparent hover:border-zinc-800 transition"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm">
                {userEmail ? userEmail[0].toUpperCase() : <User size={16} />}
              </div>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
                <div className="px-3 py-2 mb-2 border-b border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    Account
                  </p>
                  <p className="text-sm text-zinc-200 truncate">{userEmail}</p>
                </div>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                  <Settings size={16} /> Account Settings
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition mt-1"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
