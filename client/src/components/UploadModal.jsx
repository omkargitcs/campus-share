import React, { useEffect, useState } from "react";
import { X, Upload, CheckCircle2, Loader2, Globe, Users } from "lucide-react";
import API from "../api";

const MAX_BYTES = 10 * 1024 * 1024;

// teams: [{ id, name }] the user can upload into (teams they joined or teach)
const UploadModal = ({ isOpen, onClose, onUploadSuccess, teams = [] }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Notes");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && !isUploading && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isUploading, onClose]);

  const pickFile = (selected) => {
    if (!selected) return;
    const isPdf = selected.type === "application/pdf" || /\.pdf$/i.test(selected.name);
    if (!isPdf) return setError("Please select a valid PDF file.");
    if (selected.size > MAX_BYTES) return setError("That file is over the 10MB limit.");
    setFile(selected);
    setError("");
    // handy default: prefill the title from the file name
    setTitle((t) => t || selected.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim().slice(0, 120));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select a file first.");
    if (!title.trim()) return setError("Please enter a title.");

    setIsUploading(true);
    setProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("description", description.trim());
    if (teamId) formData.append("teamId", teamId);

    try {
      const response = await API.post("/resources/upload", formData, {
        onUploadProgress: (ev) => {
          const total = ev.total || file.size;
          setProgress(Math.min(100, Math.round((ev.loaded * 100) / total)));
        },
      });
      onUploadSuccess(response.data);
      setFile(null);
      setTitle("");
      setDescription("");
      setCategory("Notes");
      setTeamId("");
      onClose();
    } catch (err) {
      console.error("Upload Error Context:", err.response?.data || err.message);
      setError(
        err.response?.status === 429
          ? "You're uploading too fast. Please try again later."
          : err.response?.data?.message || "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const fieldClass =
    "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition";
  const labelClass = "text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">Upload Resource</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 ${
              file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : dragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/5"
            }`}
          >
            <input
              type="file"
              onChange={(e) => {
                pickFile(e.target.files[0]);
                e.target.value = "";
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf,application/pdf"
            />
            {file ? (
              <>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-emerald-400 truncate max-w-[240px]">{file.name}</p>
                  <p className="text-xs text-zinc-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · click to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-300">Click or drag a PDF here</p>
                  <p className="text-xs text-zinc-500">Maximum file size: 10MB</p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Resource Title</label>
              <input
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 1 - Operating Systems"
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                  <option value="Notes">Notes</option>
                  <option value="Book">Book</option>
                  <option value="PYQ">PYQ</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Share with</label>
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={fieldClass}>
                  <option value="">Everyone (public)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 -mt-2 flex items-center gap-1.5">
              {teamId ? (
                <>
                  <Users size={12} /> Only this team can see it, and it goes live after teacher approval.
                </>
              ) : (
                <>
                  <Globe size={12} /> Visible to everyone on Campus Share immediately.
                </>
              )}
            </p>

            <div>
              <div className="flex justify-between">
                <label className={labelClass}>Description</label>
                <span className="text-[10px] text-zinc-600">{description.length}/1000</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="Brief summary of syllabus contents, chapters, or author details..."
                rows={3}
                className={`${fieldClass} resize-none placeholder-zinc-600`}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="relative overflow-hidden w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {isUploading && (
              <span
                className="absolute inset-y-0 left-0 bg-blue-600/60 transition-all"
                style={{ width: `${progress}%` }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {progress < 100 ? `Uploading ${progress}%` : "Processing..."}
                </>
              ) : (
                "Upload to CampusShare"
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
