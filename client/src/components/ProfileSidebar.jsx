import React, { useCallback, useEffect, useState } from "react";
import { X, Trash2, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import API from "../api";
import { logout } from "../utils/auth";
import { spineFor } from "../utils/spines";

// Slides in from the right so it never fights the left sidebar.
const ProfileSidebar = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await API.get("/users/profile");
      setProfile(res.data);
    } catch {
      toast.error("Couldn't load your profile.");
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchProfile();
  }, [isOpen, fetchProfile]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.title}"? This can't be undone.`)) return;
    try {
      setBusy(true);
      await API.delete(`/resources/${file.id}`);
      toast.success("Resource deleted successfully");
      fetchProfile();
    } catch {
      toast.error("Couldn't delete that resource.");
    } finally {
      setBusy(false);
    }
  };

  const name = profile?.email?.split("@")[0];

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] bg-[#050a1c]/70 transition-opacity duration-200 ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label="My profile"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-y-0 right-0 z-[95] flex w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))]">
          <h2 className="text-xl font-semibold">My profile</h2>
          <button type="button" onClick={onClose} aria-label="Close profile" className="icon-btn -mr-2">
            <X size={18} />
          </button>
        </div>

        {profile ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-4 px-5 py-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-cobalt font-display text-2xl font-bold text-white">
                {name?.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-semibold">{name}</p>
                <p className="truncate text-sm text-muted">{profile.email}</p>
                <p className="text-sm text-muted">
                  {profile.role === "TEACHER" ? "Teacher" : profile.role === "ADMIN" ? "Admin" : "Student"} · member since{" "}
                  {new Date(profile.createdAt).getFullYear()}
                </p>
              </div>
            </div>

            <div className="flex items-baseline justify-between border-y border-line px-5 py-3">
              <h3 className="text-base font-semibold">Your uploads</h3>
              <span className="text-sm text-muted">{profile._count?.resources || 0} total</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {profile.resources?.length > 0 ? (
                <ul>
                  {profile.resources.map((file) => (
                    <li key={file.id} className="relative flex items-center gap-3 border-b border-line py-3 pl-6 pr-3">
                      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: spineFor(file.category) }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{file.title}</p>
                        <p className="text-xs text-muted">{new Date(file.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button type="button" disabled={busy} onClick={() => handleDelete(file)} aria-label={`Delete ${file.title}`} className="icon-btn is-danger">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-10 text-sm text-muted">You haven't shared anything yet. Uploads you add appear here.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={28} />
          </div>
        )}

        <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={logout} className="btn btn-danger w-full">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>
    </>
  );
};

export default ProfileSidebar;
