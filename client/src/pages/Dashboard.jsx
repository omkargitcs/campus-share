import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  ExternalLink,
  Download,
  FolderOpen,
  FileText,
  BookOpen,
  HelpCircle,
  Bookmark,
  Users,
  Clock,
  Flag,
  ArrowUpDown,
  GraduationCap,
} from "lucide-react";
import API from "../api";
import UploadModal from "../components/UploadModal";
import Navbar from "../components/Navbar";
import SkeletonCard from "../components/SkeletonCard";
import { toast } from "sonner";
import { useUser } from "../utils/UserContext";
import { openResource } from "../utils/openResource";
import { timeAgo } from "../utils/format";

// Category-themed header art for each card
const CategoryPlaceholder = ({ category }) => {
  const normalized = category?.toLowerCase();

  let icon = <FileText size={40} className="text-blue-400/60" />;
  let gradient = "from-blue-950/40 via-zinc-900 to-zinc-950";
  let pattern = "bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px]";

  if (normalized === "book") {
    icon = <BookOpen size={40} className="text-emerald-400/60" />;
    gradient = "from-emerald-950/40 via-zinc-900 to-zinc-950";
    pattern = "bg-[radial-gradient(#064e3b_1px,transparent_1px)] [background-size:16px_16px]";
  } else if (normalized === "pyq") {
    icon = <HelpCircle size={40} className="text-purple-400/60" />;
    gradient = "from-purple-950/40 via-zinc-900 to-zinc-950";
    pattern = "bg-[radial-gradient(#581c87_1px,transparent_1px)] [background-size:16px_16px]";
  }

  return (
    <div className={`w-full h-full bg-gradient-to-b ${gradient} relative flex items-center justify-center overflow-hidden`}>
      <div className={`absolute inset-0 opacity-20 ${pattern}`} />
      <div className="relative transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
    </div>
  );
};

const SORTS = {
  new: { label: "Newest", fn: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  popular: { label: "Most opened", fn: (a, b) => (b.downloads || 0) - (a.downloads || 0) },
  az: { label: "A to Z", fn: (a, b) => a.title.localeCompare(b.title) },
};

const Dashboard = () => {
  const { user } = useUser();
  const currentUserId = user?.id;
  const isAdmin = user?.role === "ADMIN";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resources, setResources] = useState([]);
  const [teams, setTeams] = useState({ teaching: [], joined: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("all"); // all | mine | saved
  const [source, setSource] = useState("all"); // all | public | <teamId>
  const [sortKey, setSortKey] = useState("new");
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/resources");
      setResources(data);
    } catch {
      toast.error("Failed to load resources. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const { data } = await API.get("/teams/mine");
      setTeams(data);
    } catch {
      // teams are optional for the page to work
    }
  }, []);

  useEffect(() => {
    fetchResources();
    fetchTeams();
  }, [fetchResources, fetchTeams]);

  const taughtIds = useMemo(() => new Set(teams.teaching.map((t) => t.id)), [teams]);
  const allTeams = useMemo(() => {
    const map = new Map();
    [...teams.teaching, ...teams.joined].forEach((t) => map.set(t.id, { id: t.id, name: t.name }));
    return [...map.values()];
  }, [teams]);

  const canDelete = (res) => res.ownerId === currentUserId || isAdmin || taughtIds.has(res.teamId);

  const pendingForReview = useMemo(
    () => resources.filter((r) => r.status === "PENDING" && taughtIds.has(r.teamId)).length,
    [resources, taughtIds],
  );

  const handleUploadSuccess = (data) => {
    const created = data?.resource || data;
    if (created?.id) {
      setResources((prev) => [created, ...prev]);
      toast.success(data?.message || "Resource uploaded successfully!");
    } else {
      fetchResources();
    }
  };

  const userStats = useMemo(() => {
    const mine = resources.filter((r) => r.ownerId === currentUserId);
    const totalOpens = mine.reduce((acc, r) => acc + (r.downloads || 0), 0);
    return {
      uploadCount: mine.length,
      downloadCount: totalOpens,
      impact: mine.length ? Math.round(totalOpens / mine.length) : 0,
    };
  }, [resources, currentUserId]);

  const categoryCounts = useMemo(() => {
    const counts = { All: resources.length };
    resources.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [resources]);

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources
      .filter((res) => {
        const matchesSearch =
          !q ||
          res.title?.toLowerCase().includes(q) ||
          res.description?.toLowerCase().includes(q) ||
          res.ownerName?.toLowerCase().includes(q);
        const matchesCategory = selectedCategory === "All" || res.category === selectedCategory;
        const matchesView =
          viewMode === "all" ||
          (viewMode === "mine" && res.ownerId === currentUserId) ||
          (viewMode === "saved" && res.bookmarked);
        const matchesSource =
          source === "all" || (source === "public" ? !res.teamId : res.teamId === source);
        return matchesSearch && matchesCategory && matchesView && matchesSource;
      })
      .sort(SORTS[sortKey].fn);
  }, [resources, searchQuery, selectedCategory, viewMode, source, sortKey, currentUserId]);

  const handleOpen = async (res) => {
    try {
      const data = await openResource(res.id);
      setResources((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, downloads: data.downloads ?? r.downloads } : r)),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open this resource.");
    }
  };

  const toggleBookmark = async (res) => {
    const next = !res.bookmarked;
    const apply = (value) =>
      setResources((prev) => prev.map((r) => (r.id === res.id ? { ...r, bookmarked: value } : r)));
    apply(next); // optimistic
    try {
      if (next) await API.put(`/resources/${res.id}/bookmark`);
      else await API.delete(`/resources/${res.id}/bookmark`);
      toast.success(next ? "Saved to your library" : "Removed from saved");
    } catch {
      apply(!next); // roll back
      toast.error("Couldn't update saved items.");
    }
  };

  const handleDelete = async (res) => {
    if (!window.confirm(`Delete "${res.title}"? This can't be undone.`)) return;
    try {
      await API.delete(`/resources/${res.id}`);
      setResources((prev) => prev.filter((r) => r.id !== res.id));
      toast.success("Resource deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const tabClass = (active) =>
    `flex-1 sm:flex-none px-4 sm:px-5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
      active ? "bg-zinc-900 text-white shadow-inner border border-zinc-800" : "text-zinc-500 hover:text-zinc-300"
    }`;
  const selectClass =
    "bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500 transition cursor-pointer";

  const emptyMessage = searchQuery
    ? `We couldn't find anything matching "${searchQuery}".`
    : viewMode === "saved"
      ? "Nothing saved yet. Tap the bookmark on any resource to keep it here."
      : viewMode === "mine"
        ? "You haven't uploaded anything yet."
        : "This space is currently empty. Be the hero your department needs and push the initial update!";

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans antialiased">
      <Navbar
        searchTerm={searchQuery}
        setSearchTerm={setSearchQuery}
        onUploadClick={() => setIsModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {pendingForReview > 0 && (
          <Link
            to="/teacher"
            className="mb-4 sm:mb-6 flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl px-4 py-3 hover:bg-amber-500/15 transition"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <GraduationCap size={16} />
              {pendingForReview} upload{pendingForReview === 1 ? "" : "s"} waiting for your review
            </span>
            <span className="text-xs font-bold">Review →</span>
          </Link>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
          {[
            ["Uploads", userStats.uploadCount, "text-zinc-100"],
            ["Reach", userStats.downloadCount, "text-blue-500"],
            ["Impact", `${userStats.impact}x`, "text-emerald-500"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="bg-zinc-950 border border-zinc-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-center sm:text-left"
            >
              <p className="text-zinc-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest mb-0.5 sm:mb-1 truncate">
                {label}
              </p>
              <p className={`text-xl sm:text-3xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 w-full lg:w-auto justify-center">
              <button onClick={() => setViewMode("all")} className={tabClass(viewMode === "all")}>
                All Resources
              </button>
              <button onClick={() => setViewMode("mine")} className={tabClass(viewMode === "mine")}>
                My Uploads
              </button>
              <button onClick={() => setViewMode("saved")} className={tabClass(viewMode === "saved")}>
                Saved
              </button>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={`${selectClass} flex-1 lg:flex-none`}
                aria-label="Filter by source"
              >
                <option value="all">All sources</option>
                <option value="public">Public only</option>
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 lg:flex-none">
                <ArrowUpDown size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className={`${selectClass} pl-8 w-full`}
                  aria-label="Sort resources"
                >
                  {Object.entries(SORTS).map(([key, s]) => (
                    <option key={key} value={key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
            {["All", "Notes", "Book", "PYQ"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap snap-center flex items-center gap-2 ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                {cat}
                <span className={`text-[10px] ${selectedCategory === cat ? "text-blue-200" : "text-zinc-600"}`}>
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

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
                    <CategoryPlaceholder category={res.category} />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                      <span className="bg-blue-600 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md shadow-md select-none">
                        {res.category}
                      </span>
                      {res.status === "PENDING" && (
                        <span className="bg-amber-500/90 text-black text-[9px] font-black tracking-wider uppercase px-2 py-1 rounded-md flex items-center gap-1">
                          <Clock size={10} /> Awaiting approval
                        </span>
                      )}
                      {res.status === "FLAGGED" && (
                        <span className="bg-red-500/90 text-white text-[9px] font-black tracking-wider uppercase px-2 py-1 rounded-md flex items-center gap-1">
                          <Flag size={10} /> Flagged
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button
                        onClick={() => toggleBookmark(res)}
                        aria-label={res.bookmarked ? "Remove from saved" : "Save for later"}
                        className={`p-2 border rounded-xl transition-all backdrop-blur-md active:scale-90 ${
                          res.bookmarked
                            ? "bg-blue-600/90 border-blue-400/40 text-white"
                            : "bg-black/40 border-white/5 text-zinc-200 hover:bg-blue-600/80 md:opacity-0 md:group-hover:opacity-100"
                        }`}
                      >
                        <Bookmark size={14} fill={res.bookmarked ? "currentColor" : "none"} />
                      </button>
                      {canDelete(res) && (
                        <button
                          onClick={() => handleDelete(res)}
                          aria-label="Delete resource"
                          className="p-2 bg-black/40 border border-white/5 hover:bg-red-500/90 rounded-xl transition-all backdrop-blur-md md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 size={14} className="text-zinc-200" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-zinc-100 truncate group-hover:text-blue-400 transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 truncate">
                      <span className="truncate">{res.ownerName}</span>
                      <span>·</span>
                      <span className="shrink-0">{timeAgo(res.createdAt)}</span>
                      {res.team && (
                        <span className="ml-auto shrink-0 flex items-center gap-1 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded max-w-[45%]">
                          <Users size={10} className="shrink-0" />
                          <span className="truncate">{res.team.name}</span>
                        </span>
                      )}
                    </p>
                    <p className="text-zinc-500 text-xs line-clamp-2 mt-2 min-h-[2rem]">
                      {res.description || "No description provided for this campus resource."}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 mt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-900/50">
                  <span className="flex items-center gap-1 mt-3 select-none">
                    <Download size={12} className="text-zinc-500" /> {res.downloads || 0} opens
                  </span>
                  <button
                    onClick={() => handleOpen(res)}
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
              <h3 className="text-base font-bold text-white mb-1">No resources found</h3>
              <p className="text-zinc-500 text-xs max-w-xs mb-6">{emptyMessage}</p>
              {!searchQuery && viewMode !== "saved" && (
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
        teams={allTeams}
      />
    </div>
  );
};

export default Dashboard;
