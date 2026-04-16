import React, { useState, useCallback } from "react";
import { X, Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please select a valid PDF file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select a file first.");

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("category", category);

    try {
      // Extracting token from localStorage for your IAM system
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/resources/upload",
        {
          method: "POST",
          headers: {
            // IMPORTANT: Do NOT set Content-Type; the browser sets it for FormData
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) throw new Error("Upload failed. Please try again.");

      const result = await response.json();
      onUploadSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">Upload Resource</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3
            ${file ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/5"}`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf"
            />
            {file ? (
              <>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-emerald-400 truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-300">
                    Click or drag PDF to upload
                  </p>
                  <p className="text-xs text-zinc-500">
                    Maximum file size: 10MB
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
                Resource Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 1 - Operating Systems"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option>Computer Science</option>
                <option>Information Technology</option>
                <option>Mathematics</option>
                <option>Physics</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Upload to CampusShare"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
