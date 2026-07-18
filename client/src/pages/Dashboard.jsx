import React, { useState, useEffect, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Trash2,
  ExternalLink,
  Search,
  Download,
  FolderOpen,
  FileText,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import API from "../api";
import UploadModal from "../components/UploadModal";
import Navbar from "../components/Navbar";
import ProfileSidebar from "../components/ProfileSidebar";
import { toast } from "sonner";
import SkeletonCard from "../components/SkeletonCard";

// Dynamic cinematic placecard generator for text files/documents without images
const CategoryPlaceholder = ({ category }) => {
  const normalized = category?.toLowerCase();

  let icon = <FileText size={40} className="text-blue-400/60" />;
  let gradient = "from-blue-950/40 via-zinc-900 to-zinc-950";
  let pattern =
    "bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px]";

  if (normalized === "book") {
    icon = <BookOpen size={40} className="text-emerald-400/60" />;
    gradient = "from-emerald-950/40 via-zinc-900 to-zinc-950";
    pattern =
      "bg-[radial-gradient(#064e3b_1px,transparent_1px)] [background-size:16px_16px]";
  } else if (normalized === "pyq") {
    icon = <HelpCircle size={40} className="text-purple-400/60" />;
    gradient = "from-purple-950/40 via-zinc-900 to-zinc-950";
    pattern =
      "bg-[radial-gradient(#581c87_1px,transparent_1px)] [background-size:16px_16px]";
  }

  return (
    <div
      className={`w-full h-full bg-gradient-to-b ${gradient} relative flex items-center justify-center overflow-hidden`}
    >
      <div className={`absolute inset-0 opacity-20 ${pattern}`} />
      <div className="relative transform group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("all");
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      const { data } = await API.get("/resources");
      setResources(data);
    } catch (err) {
      toast.error("Failed to load resources. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newUploadedData) => {
    const cleanResource = newUploadedData.resource
      ? newUploadedData.resource
      : newUploadedData;

    if (cleanResource && cleanResource.id) {
      setResources((prev) => [cleanResource, ...prev]);
      toast.success("Resource uploaded successfully!");
    } else {
      fetchResources();
    }
  };

  const userStats = useMemo(() => {
    const myResources = resources.filter(
      (res) => res?.ownerId === currentUserId,
    );
    const totalDownloads = myResources.reduce(
      (acc, curr) => acc + (curr?.downloads || 0),
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
      if (!res) return false;
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
    if (!id || !fileUrl) {
      toast.error("Resource link corrupted or missing.");
      return;
    }

    try {
      toast.info("Opening resource...");
      await API.post(`/resources/stats/${id}`, { type: "downloads" });

      setResources((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, downloads: (item.downloads || 0) + 1 }
            : item,
        ),
      );

      window.open(fileUrl, "_blank");
    } catch (err) {
      console.error("Tracking error tracking logs:", err);
      window.open(fileUrl, "_blank");
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await API.delete(`/resources/${id}`);
        setResources((prev) => prev.filter((item) => item.id !== id));
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

  const hasImageExtension = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url.split("?")[0]);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans antialiased">
      <Navbar
        userEmail={token ? "Student Account" : ""}
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        onUploadClick={() => setIsModalOpen(true)}
        onProfileClick={() => setSidebarOpen(true)}
      />

      <ProfileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* COMPACT MOBILE STATS LAYOUT - Grid structure that changes to horizontal metrics row on screens like phones */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-zinc-950 border border-zinc-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-center sm:text-left">
            <p className="text-zinc-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1 truncate">
              Uploads
            </p>
            <p className="text-xl sm:text-3xl font-black text-zinc-100">
              {userStats.uploadCount}
            </p>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-center sm:text-left">
            <p className="text-zinc-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1 truncate">
              Reach
            </p>
            <p className="text-xl sm:text-3xl font-black text-blue-500">
              {userStats.downloadCount}
            </p>
          </div>
          <div className="bg-zinc-950 border border-zinc-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-center sm:text-left">
            <p className="text-zinc-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1 truncate">
              Impact
            </p>
            <p className="text-xl sm:text-3xl font-black text-emerald-500">
              {userStats.impact}x
            </p>
          </div>
        </div>

        {/* SEARCH & LIBRARY TOGGLE CONTROLS */}
        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80 md:w-96">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-zinc-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 w-full sm:w-auto justify-center">
              <button
                onClick={() => setViewMode("all")}
                className={`flex-1 sm:flex-none px-4 sm:px-5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  viewMode === "all"
                    ? "bg-zinc-900 text-white shadow-inner border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                All Resources
              </button>
              <button
                onClick={() => setViewMode("mine")}
                className={`flex-1 sm:flex-none px-4 sm:px-5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  viewMode === "mine"
                    ? "bg-zinc-900 text-white shadow-inner border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                My Library
              </button>
            </div>
          </div>

          {/* HORIZONTAL CATEGORY SCROLL CONTAINER */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
            {["All", "Notes", "Book", "PYQ"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap snap-center ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* RESPONSIVE GRID FOR CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            [...Array(8)].map((_, index) => <SkeletonCard key={index} />)
          ) : filteredResources.length > 0 ? (
            filteredResources.map((res) => (
              <div
                key={res.id}
                className="group bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-800 transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative h-40 bg-zinc-900 overflow-hidden">
                    {hasImageExtension(res.fileUrl) ? (
                      <img
                        src={getThumbnail(res.fileUrl)}
                        alt="Resource Header"
                        className="w-full h-full object-cover opacity-40 group-hover:scale-105 group-hover:opacity-60 transition-all duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <CategoryPlaceholder category={res.category} />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                    <span className="absolute top-3 left-3 bg-blue-600 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md shadow-md select-none">
                      {res.category}
                    </span>

                    {res.ownerId === currentUserId && (
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="absolute top-3 right-3 p-2 bg-black/40 border border-white/5 hover:bg-red-500/90 rounded-xl transition-all backdrop-blur-md md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2
                          size={14}
                          className="text-zinc-200 group-hover:text-white"
                        />
                      </button>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-zinc-100 truncate flex-1 group-hover:text-blue-400 transition-colors">
                        {res.title}
                      </h3>
                      <span className="text-emerald-400 font-black text-xs shrink-0 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                        {parseFloat(res.price) === 0 || !res.price
                          ? "FREE"
                          : `$${res.price}`}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs line-clamp-2 mt-1 min-h-[2rem]">
                      {res.description ||
                        "No description provided for this campus resource asset."}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 mt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-900/50">
                  <span className="flex items-center gap-1 mt-3 select-none">
                    <Download size={12} className="text-zinc-500" />{" "}
                    {res.downloads || 0} hits
                  </span>
                  <button
                    onClick={() => handleDownload(res.id, res.fileUrl)}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-lg hover:bg-white hover:text-black hover:border-white transition-all shadow-sm"
                  >
                    View <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center bg-zinc-950 border border-dashed border-zinc-900 rounded-3xl">
              <div className="w-16 h-16 bg-zinc-900/30 rounded-full flex items-center justify-center mb-4 border border-zinc-800/80">
                <FolderOpen size={28} className="text-zinc-600" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                No resources found
              </h3>
              <p className="text-zinc-500 text-xs max-w-xs mb-6">
                {searchQuery
                  ? `We couldn't find anything matching "${searchQuery}". Try adjusting your query labels.`
                  : "This space is currently empty. Be the hero your department needs and push the initial update!"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/10"
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
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Dashboard;
