import React, { useState, useEffect, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Trash2,
  ExternalLink,
  Search,
  Download,
  FolderOpen,
} from "lucide-react";
import API from "../api";
import UploadModal from "../components/UploadModal";
import Navbar from "../components/Navbar";
import { toast } from "sonner";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("all");

  const token = localStorage.getItem("token");
  let currentUserId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      currentUserId = decoded.id;
    } catch (err) {
      console.error("Token decode failed");
    }
  }

  const fetchResources = async () => {
    try {
      const { data } = await API.get("/resources");
      setResources(data);
    } catch (err) {
      toast.error("Failed to load resources. Check your connection.");
    }
  };

  const userStats = useMemo(() => {
    const myResources = resources.filter(
      (res) => res.ownerId === currentUserId,
    );
    const totalDownloads = myResources.reduce(
      (acc, curr) => acc + (curr.downloads || 0),
      0,
    );
    const impact =
      myResources.length > 0
        ? Math.round(totalDownloads / myResources.length)
        : 0;

    return {
      uploadCount: myResources.length,
      downloadCount: totalDownloads,
      impact: impact,
    };
  }, [resources, currentUserId]);

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch =
        res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || res.category === selectedCategory;
      const matchesUser = viewMode === "all" || res.ownerId === currentUserId;

      return matchesSearch && matchesCategory && matchesUser;
    });
  }, [resources, searchQuery, selectedCategory, viewMode, currentUserId]);

  const handleDownload = async (id, fileUrl) => {
    try {
      await API.patch(`/resources/${id}/download`);
      fetchResources();
      toast.info("Opening resource...");
      window.open(fileUrl, "_blank");
    } catch (err) {
      toast.error("Could not track download");
      window.open(fileUrl, "_blank");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await API.delete(`/resources/${id}`);
        fetchResources();
        toast.success("Resource deleted successfully");
      } catch (err) {
        toast.error(err.response?.data?.message || "Delete failed");
      }
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const getThumbnail = (url) => {
    if (!url) return "";
    return url
      .replace(/\.[^/.]+$/, ".jpg")
      .replace("/upload/", "/upload/w_400,h_300,c_fill,g_north,pg_1/");
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <Navbar
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        onUploadClick={() => setIsModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              My Uploads
            </p>
            <p className="text-3xl font-bold text-white">
              {userStats.uploadCount}
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              Total Reach
            </p>
            <p className="text-3xl font-bold text-blue-400">
              {userStats.downloadCount}
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              Avg. Impact
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              {userStats.impact}x
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setViewMode("all")}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewMode === "all"
                    ? "bg-zinc-100 text-black shadow-lg"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                All Resources
              </button>
              <button
                onClick={() => setViewMode("mine")}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewMode === "mine"
                    ? "bg-zinc-100 text-black shadow-lg"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                My Library
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {["All", "Notes", "Book", "PYQ"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResources.length > 0 ? (
            filteredResources.map((res) => (
              <div
                key={res.id}
                className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all"
              >
                <div className="relative h-44 bg-zinc-800">
                  <img
                    src={getThumbnail(res.fileUrl)}
                    alt="Preview"
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&h=300&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-blue-600 text-[10px] font-bold uppercase tracking-widest rounded shadow-lg">
                    {res.category}
                  </div>
                  {res.ownerId === currentUserId && (
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-500/80 rounded-full transition-colors backdrop-blur-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-zinc-100 line-clamp-1">
                      {res.title}
                    </h3>
                    <span className="text-emerald-400 font-bold text-sm">
                      ${res.price}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs line-clamp-2 mb-6 h-8">
                    {res.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Download size={12} /> {res.downloads || 0} Downloads
                    </div>
                    <button
                      onClick={() => handleDownload(res.id, res.fileUrl)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                    >
                      View <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center bg-zinc-900/10 border border-dashed border-zinc-800 rounded-3xl">
              <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                <FolderOpen size={40} className="text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                No resources found
              </h3>
              <p className="text-zinc-500 max-w-sm mb-8">
                {searchQuery
                  ? `We couldn't find anything matching "${searchQuery}". Try a different keyword.`
                  : "This space is empty! Be the hero your campus needs and upload the first resource."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                  Upload Now
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={fetchResources}
      />
    </div>
  );
};

export default Dashboard;
