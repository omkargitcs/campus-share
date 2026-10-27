import React, { useEffect, useState } from "react";
import {
  X,
  User,
  Mail,
  Calendar,
  FileText,
  LogOut,
  Trash2,
  Loader2,
} from "lucide-react";
import API from "../api";
import { toast } from "sonner";

const ProfileSidebar = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch profile data whenever the sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("Profile fetch error:", err);
      toast.error("Failed to load profile");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;

    try {
      setLoading(true);
      await API.delete(`/resources/${id}`);
      toast.success("Resource deleted successfully");
      fetchProfile(); // Refresh the list
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete resource");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Background Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* Sliding Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 md:w-96 bg-[#0c0c0e] border-r border-zinc-800 z-50 transform transition-transform duration-500 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">My Account</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {profile ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* User Identity Section */}
              <div className="flex flex-col items-center py-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 mb-6">
                <div className="w-20 h-20 bg-blue-600/10 border border-blue-600/30 rounded-full flex items-center justify-center mb-4">
                  <User size={40} className="text-blue-500" />
                </div>
                <p className="text-zinc-100 font-bold text-lg">
                  {profile.email.split("@")[0]}
                </p>
                <span className="text-[10px] bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full mt-2 uppercase tracking-widest font-black border border-blue-600/30">
                  {profile.role || "Contributor"}
                </span>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <FileText size={16} className="text-zinc-500 mb-1" />
                  <p className="text-xl font-bold">
                    {profile._count?.resources || 0}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">
                    Total Uploads
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <Calendar size={16} className="text-zinc-500 mb-1" />
                  <p className="text-sm font-bold">
                    {new Date(profile.createdAt).getFullYear()}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">
                    Member Since
                  </p>
                </div>
              </div>

              {/* My Uploads List Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText size={14} /> My Uploaded Files
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                  {profile.resources?.length > 0 ? (
                    profile.resources.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/20 border border-zinc-800/50 hover:border-zinc-700 transition-all group"
                      >
                        <div className="flex flex-col overflow-hidden max-w-[70%]">
                          <span className="text-sm text-zinc-200 truncate font-medium">
                            {file.title}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          disabled={loading}
                          onClick={() => handleDelete(file.id)}
                          className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-2xl">
                      <p className="text-sm text-zinc-600 italic">
                        No resources shared yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          )}

          {/* Logout Button at bottom */}
          <button
            className="mt-6 flex items-center justify-center gap-2 w-full bg-red-500/10 text-red-500 py-3.5 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all font-bold"
            onClick={handleLogout}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileSidebar;
