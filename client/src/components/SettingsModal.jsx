import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import API from "../api";
import Modal from "./Modal";

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
const STRENGTH_COLORS = ["var(--danger)", "var(--danger)", "var(--wait)", "var(--ok)", "var(--ok)"];

// Rendered only while open, so every opening starts with empty fields.
const SettingsModal = ({ onClose }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const strength = strengthOf(next);
  const type = show ? "text" : "password";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords don't match.");

    setSaving(true);
    try {
      const { data } = await API.patch("/users/password", { currentPassword: current, newPassword: next });
      // The server signs out every older session and returns a fresh token for this one.
      if (data?.token) localStorage.setItem("token", data.token);
      toast.success("Password updated");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Account settings" onClose={onClose} width="max-w-md">
      <form onSubmit={submit} className="space-y-4" autoComplete="off">
        <h3 className="text-lg font-semibold">Change password</h3>

        <div>
          <label htmlFor="cur" className="label">Current password</label>
          <input id="cur" type={type} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className="field" />
        </div>

        <div>
          <label htmlFor="new" className="label">New password</label>
          <div className="relative">
            <input id="new" type={type} value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required maxLength={72} className="field pr-11" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide passwords" : "Show passwords"} className="icon-btn absolute right-1 top-1/2 -translate-y-1/2">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {next && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i < strength ? STRENGTH_COLORS[strength] : "var(--line)" }} />
                ))}
              </div>
              <p className="hint mt-1">{STRENGTH_LABELS[strength]}</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="conf" className="label">Confirm new password</label>
          <input id="conf" type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required maxLength={72} className="field" />
        </div>

        {error && <p role="alert" className="notice-error">{error}</p>}

        <button type="submit" disabled={saving} className="btn btn-primary w-full">
          {saving ? <Loader2 size={18} className="animate-spin" /> : "Update password"}
        </button>
      </form>
    </Modal>
  );
};

export default SettingsModal;
