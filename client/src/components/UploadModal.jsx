import React, { useState } from "react";
import { Upload, FileCheck2, Loader2, Globe, Users } from "lucide-react";
import API from "../api";
import Modal from "./Modal";

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

  if (!isOpen) return null;

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

  return (
    <Modal title="Upload a resource" onClose={onClose} locked={isUploading}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={() => setDragging(false)}
          className={`relative flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-8 text-center transition-colors ${
            file ? "border-solid border-ok" : dragging ? "border-dashed border-accent bg-sunk" : "border-dashed border-line hover:border-muted"
          }`}
        >
          <input
            type="file"
            aria-label="Choose a PDF"
            onChange={(e) => {
              pickFile(e.target.files[0]);
              e.target.value = "";
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
            accept=".pdf,application/pdf"
          />
          {file ? (
            <>
              <FileCheck2 size={22} className="text-ok" />
              <p className="max-w-full truncate text-sm font-semibold">{file.name}</p>
              <p className="hint">{(file.size / 1024 / 1024).toFixed(2)} MB. Click to choose a different file.</p>
            </>
          ) : (
            <>
              <Upload size={22} className="text-muted" />
              <p className="text-sm font-semibold">Drop a PDF here or click to browse</p>
              <p className="hint">Up to 10MB</p>
            </>
          )}
        </div>

        <div>
          <label htmlFor="up-title" className="label">Title</label>
          <input id="up-title" type="text" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Operating Systems, Unit 1" className="field" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="up-cat" className="label">Category</label>
            <select id="up-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              <option value="Notes">Notes</option>
              <option value="Book">Book</option>
              <option value="PYQ">PYQ (past papers)</option>
            </select>
          </div>
          <div>
            <label htmlFor="up-team" className="label">Share with</label>
            <select id="up-team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className="field">
              <option value="">Everyone (public)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="hint -mt-2 flex items-start gap-2">
          {teamId ? (
            <>
              <Users size={15} className="mt-0.5 shrink-0" /> Only this team can see it, and it goes live after your teacher approves it.
            </>
          ) : (
            <>
              <Globe size={15} className="mt-0.5 shrink-0" /> Everyone on Campus Share can see it right away.
            </>
          )}
        </p>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="up-desc" className="label">Description</label>
            <span className="hint">{description.length}/1000</span>
          </div>
          <textarea id="up-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} placeholder="Chapters covered, syllabus, or the author" className="field" />
        </div>

        {error && <p role="alert" className="notice-error">{error}</p>}

        <button type="submit" disabled={isUploading} className="btn btn-primary relative w-full overflow-hidden !h-11">
          {isUploading && <span className="absolute inset-y-0 left-0 bg-white/25 transition-all" style={{ width: `${progress}%` }} />}
          <span className="relative flex items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {progress < 100 ? `Uploading ${progress}%` : "Processing…"}
              </>
            ) : (
              "Upload"
            )}
          </span>
        </button>
      </form>
    </Modal>
  );
};

export default UploadModal;
