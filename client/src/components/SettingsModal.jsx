import React, { useEffect, useState } from "react";
import { X, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import API from "../api";

const strengthOf = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};
const STRENGTH_LABELS = ["Too weak", "Weak", "Okay", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-red-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-400",
];

const SettingsModal = ({ isOpen, onClose }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setShow(false);
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        reset();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const strength = strengthOf(next);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < 8)
      return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords don't match.");

    setSaving(true);
    try {
      const { data } = await API.patch("/users/password", {
        currentPassword: current,
        newPassword: next,
      });
      // The server signs out every older session and returns a fresh token for this one.
      if (data?.token) localStorage.setItem("token", data.token);
      toast.success("Password updated");
      close();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock size={18} className="text-blue-500" /> Account Settings
          </h2>
          <button
            onClick={close}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4" autoComplete="off">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Change password
          </p>

          <input
            type={show ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            required
            className={inputClass}
          />

          <div>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="New password (min 8 characters)"
                autoComplete="new-password"
                required
                maxLength={72}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide passwords" : "Show passwords"}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {next && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength ? STRENGTH_COLORS[strength] : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {STRENGTH_LABELS[strength]}
                </p>
              </div>
            )}
          </div>

          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            maxLength={72}
            className={inputClass}
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Update password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
