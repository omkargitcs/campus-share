import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Trash2, ExternalLink, Bookmark, Users, Clock, Flag, Plus, Search, X } from "lucide-react";
import API from "../api";
import UploadModal from "../components/UploadModal";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SkeletonRow from "../components/SkeletonRow";
import { toast } from "sonner";
import { useUser } from "../utils/UserContext";
import { openResource } from "../utils/openResource";
import { timeAgo } from "../utils/format";
import { spineFor } from "../utils/spines";

const SORTS = {
  new: { label: "Newest first", fn: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  popular: { label: "Most opened", fn: (a, b) => (b.downloads || 0) - (a.downloads || 0) },
  az: { label: "A to Z", fn: (a, b) => a.title.localeCompare(b.title) },
};

const VIEWS = [
  ["all", "All resources"],
  ["mine", "My uploads"],
  ["saved", "Saved"],
];

const CATEGORIES = ["All", "Notes", "Book", "PYQ"];

// Same columns for the header and every row so the table lines up on desktop.
const COLS = "lg:grid lg:grid-cols-[minmax(0,1fr)_4.5rem_9.5rem_5.5rem_3.5rem_10rem] lg:items-center lg:gap-x-4";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

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
  const [selectedId, setSelectedId] = useState(null);
  const searchRef = useRef(null);

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

  // "/" jumps to search, Escape clears the mark
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape" && !typing) {
        setSelectedId(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
    return { uploadCount: mine.length, opens: mine.reduce((acc, r) => acc + (r.downloads || 0), 0) };
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
        const matchesSource = source === "all" || (source === "public" ? !res.teamId : res.teamId === source);
        return matchesSearch && matchesCategory && matchesView && matchesSource;
      })
      .sort(SORTS[sortKey].fn);
  }, [resources, searchQuery, selectedCategory, viewMode, source, sortKey, currentUserId]);

  const handleOpen = async (res) => {
    try {
      const data = await openResource(res.id);
      setResources((prev) => prev.map((r) => (r.id === res.id ? { ...r, downloads: data.downloads ?? r.downloads } : r)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open this resource.");
    }
  };

  const toggleBookmark = async (res) => {
    const next = !res.bookmarked;
    const apply = (value) => setResources((prev) => prev.map((r) => (r.id === res.id ? { ...r, bookmarked: value } : r)));
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

  const empty = searchQuery
    ? { title: "No matches", text: `Nothing matches "${searchQuery}". Try a shorter search or a different category.` }
    : viewMode === "saved"
      ? { title: "Nothing saved yet", text: "Use the bookmark on any resource and it will be kept here." }
      : viewMode === "mine"
        ? { title: "No uploads yet", text: "Resources you upload will be listed here." }
        : { title: "The shelves are empty", text: "Nobody has shared anything here yet. Upload the first resource." };

  return (
    <AppShell wide>
      <PageHeader
        title="Library"
        actions={
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={17} /> Upload resource
          </button>
        }
      >
        {userStats.uploadCount > 0
          ? `You've shared ${plural(userStats.uploadCount, "resource")}, opened ${plural(userStats.opens, "time")} in total.`
          : "Notes, books and past papers shared across your campus."}
      </PageHeader>

      {pendingForReview > 0 && (
        <Link to="/teacher" className="mb-6 flex items-center justify-between gap-3 border-l-4 border-wait bg-surface px-4 py-3 text-sm transition hover:bg-sunk">
          <span className="flex items-center gap-2">
            <Clock size={16} className="text-wait" />
            <span>
              <strong>{plural(pendingForReview, "upload")}</strong> waiting for your review
            </span>
          </span>
          <span className="font-semibold text-link">Review</span>
        </Link>
      )}

      <div role="tablist" aria-label="Show" className="-mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0">
        {VIEWS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={viewMode === key} onClick={() => setViewMode(key)} className="tab">
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:max-w-md md:flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
                e.target.blur();
              }
            }}
            placeholder="Search title, description or uploader"
            aria-label="Search resources"
            className="field !h-10 pl-9 pr-10"
          />
          {searchQuery ? (
            <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="icon-btn absolute right-0.5 top-1/2 !h-9 !w-9 -translate-y-1/2">
              <X size={15} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-xs text-muted lg:block">/</kbd>
          )}
        </div>

        <div className="flex gap-2 md:ml-auto">
          <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source" className="field !h-10 min-w-0 flex-1 md:!w-auto md:flex-none">
            <option value="all">All sources</option>
            <option value="public">Public only</option>
            {allTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort resources" className="field !h-10 min-w-0 flex-1 md:!w-auto md:flex-none">
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {CATEGORIES.map((cat) => (
          <button key={cat} type="button" aria-pressed={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} className="chip">
            {cat !== "All" && <span className="h-3 w-1.5 rounded-sm" style={{ background: spineFor(cat) }} />}
            {cat}
            <span className="count">{categoryCounts[cat] || 0}</span>
          </button>
        ))}
      </div>

      <p className="mb-2 mt-6 text-sm text-muted" aria-live="polite">
        {loading ? "Loading the library…" : `Showing ${filteredResources.length} of ${plural(resources.length, "resource")}`}
      </p>

      <div className={`hidden border-b border-line pb-2 pl-6 pr-3 text-sm font-medium text-muted ${COLS}`}>
        <span>Title</span>
        <span>Category</span>
        <span>Source</span>
        <span>Added</span>
        <span>Opens</span>
        <span />
      </div>

      {loading ? (
        <ul>
          {[...Array(7)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </ul>
      ) : filteredResources.length > 0 ? (
        <ul>
          {filteredResources.map((res) => {
            const isSel = selectedId === res.id;
            return (
              <li key={res.id} data-marked={isSel} className="row">
                <span className="spine" style={{ background: spineFor(res.category) }} />
                <span className="mark" />
                <div className={`content py-3.5 pl-6 pr-3 ${COLS}`}>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        aria-pressed={isSel}
                        onClick={() => setSelectedId(isSel ? null : res.id)}
                        className="stretch min-w-0 truncate text-left text-[15px] font-semibold"
                      >
                        {res.title}
                      </button>
                      {res.status === "PENDING" && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-wait">
                          <Clock size={12} /> Awaiting approval
                        </span>
                      )}
                      {res.status === "FLAGGED" && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-danger">
                          <Flag size={12} /> Flagged
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted">
                      {res.ownerName}
                      <span className="lg:hidden">
                        {" "}
                        · {res.category} · {timeAgo(res.createdAt)} · {plural(res.downloads || 0, "open")}
                        {res.team ? ` · ${res.team.name}` : ""}
                      </span>
                    </p>
                    {isSel && <p className="mt-2 max-w-[62ch] text-sm">{res.description || "No description added."}</p>}
                  </div>

                  <span className="hidden text-sm lg:block">{res.category}</span>
                  <span className="hidden min-w-0 items-center gap-1.5 text-sm text-muted lg:flex">
                    {res.team ? (
                      <>
                        <Users size={13} className="shrink-0" />
                        <span className="truncate">{res.team.name}</span>
                      </>
                    ) : (
                      "Public"
                    )}
                  </span>
                  <span className="hidden text-sm text-muted lg:block">{timeAgo(res.createdAt)}</span>
                  <span className="hidden text-sm tabular-nums text-muted lg:block">{res.downloads || 0}</span>

                  <div className="above mt-2 flex items-center justify-end gap-1 lg:mt-0">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(res)}
                      aria-pressed={!!res.bookmarked}
                      aria-label={res.bookmarked ? `Remove ${res.title} from saved` : `Save ${res.title} for later`}
                      className={`icon-btn ${res.bookmarked ? "!text-link" : ""}`}
                    >
                      <Bookmark size={17} fill={res.bookmarked ? "currentColor" : "none"} />
                    </button>
                    {canDelete(res) && (
                      <button type="button" onClick={() => handleDelete(res)} aria-label={`Delete ${res.title}`} className="icon-btn is-danger">
                        <Trash2 size={17} />
                      </button>
                    )}
                    <button type="button" onClick={() => handleOpen(res)} aria-label={`Open ${res.title}`} className={`btn btn-sm ${isSel ? "btn-primary" : "btn-quiet"}`}>
                      Open <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-b border-line py-14">
          <h2 className="text-2xl font-semibold">{empty.title}</h2>
          <p className="mt-2 max-w-[48ch] text-muted">{empty.text}</p>
          {!searchQuery && viewMode !== "saved" && (
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-5">
              <Plus size={17} /> Upload resource
            </button>
          )}
        </div>
      )}

      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUploadSuccess={handleUploadSuccess} teams={allTeams} />
    </AppShell>
  );
};

export default Dashboard;
