import React, { useState } from "react";
import { X, UploadCloud, Loader2, FileCheck } from "lucide-react";
import API from "../api";
import axios from "axios";
import { toast } from "sonner";
const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Notes",
    price: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first");
    setLoading(true);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "campus_share");
      data.append("cloud_name", "dqqbxk3ip");

      const cloudinaryRes = await axios.post(
        "https://api.cloudinary.com/v1_1/dqqbxk3ip/auto/upload",
        data,
      );
      const fileUrl = cloudinaryRes.data.secure_url;

      await API.post("/resources", {
        ...formData,
        fileUrl,
        price: parseFloat(formData.price) || 0,
      });

      onUploadSuccess();
      onClose();
      setFile(null); // Reset file
      alert("Resource Shared Successfully!");
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Upload Failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Upload Resource</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Title (e.g. OS Lecture Notes)"
            required
            className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />

          <textarea
            placeholder="Description"
            required
            className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 h-24"
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="relative border-2 border-dashed border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center hover:border-blue-500 transition-colors group">
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            {file ? (
              <div className="flex items-center gap-2 text-blue-400">
                <FileCheck size={24} />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
            ) : (
              <>
                <UploadCloud
                  className="text-zinc-500 group-hover:text-blue-400 mb-2"
                  size={32}
                />
                <p className="text-zinc-500 text-sm">
                  Click to select PDF or Image
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              className="bg-[#09090b] border border-zinc-800 rounded-lg p-3 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option>Notes</option>
              <option>Book</option>
              <option>PYQ</option>
            </select>
            <input
              type="number"
              placeholder="Price ($)"
              className="bg-[#09090b] border border-zinc-800 rounded-lg p-3 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-zinc-100 text-zinc-900 font-bold py-3 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud size={20} /> Post Resource
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
