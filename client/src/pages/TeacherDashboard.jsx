import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Copy,
  RefreshCw,
  Users,
  CheckCircle2,
  Flag,
  ExternalLink,
  UserMinus,
  Inbox,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import API from "../api";
import Navbar from "../components/Navbar";
import { openResource } from "../utils/openResource";
import { timeAgo } from "../utils/format";

const STATUS_STYLE = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FLAGGED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const TeacherDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState("review"); // review | all | members
  const [resources, setResources] = useState([]);
  const [members, setMembers] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const requestSeq = useRef(0); // ignore stale responses when switching teams quickly

  const activeTeam = teams.find((t) => t.id === activeId) || null;

  const loadTeams = useCallback(async () => {
    try {
      const { data } = await API.get("/teams/mine");
      setTeams(data.teaching);
    } catch {
      toast.error("Failed to load your teams");
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const openTeam = async (team) => {
    const seq = ++requestSeq.current;
    setActiveId(team.id);
    setTab("review");
    setLoadingTeam(true);
    try {
      const [res, mem] = await Promise.all([
        API.get(`/teams/${team.id}/resources`),
        API.get(`/teams/${team.id}/members`),
      ]);
      if (seq !== requestSeq.current) return;
      setResources(res.data);
      setMembers(mem.data);
    } catch {
      if (seq === requestSeq.current) toast.error("Failed to load team details");
    } finally {
      if (seq === requestSeq.current) setLoadingTeam(false);
    }
  };

  const createTeam = async (e) => {
    e.preventDefault();
    const name = newTeamName.trim();
    if (name.length < 2) return toast.error("Give your team a name (2+ characters)");
    setCreating(true);
    try {
      await API.post("/teams", { name });
      toast.success("Team created. Share the invite code with your class.");
      setNewTeamName("");
      loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Invite code copied");
    } catch {
      toast.error("Couldn't copy. Select the code and copy it manually.");
    }
  };

  const regenerate = async (team) => {
    if (!window.confirm("Generate a new invite code? The old one will stop working immediately.")) return;
    try {
      const { data } = await API.post(`/teams/${team.id}/invite`);
      setTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, inviteCode: data.inviteCode } : t)));
      toast.success("New invite code generated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to regenerate code");
    }
  };

  const setStatus = async (r, status) => {
    setBusyId(r.id);
    try {
      await API.patch(`/resources/${r.id}/status`, { status });
      setResources((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
      toast.success(status === "APPROVED" ? "Approved. The uploader was notified." : "Flagged and hidden.");
      loadTeams(); // refresh pending counts
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const viewFile = async (r) => {
    try {
      await openResource(r.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open file");
    }
  };

  const removeMember = async (m) => {
    if (!window.confirm(`Remove ${m.email} from "${activeTeam.name}"?`)) return;
    try {
      await API.delete(`/teams/${activeTeam.id}/members/${m.id}`);
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
      loadTeams();
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  const pending = resources.filter((r) => r.status === "PENDING");
  const visibleResources = tab === "review" ? pending : resources;

  const tabClass = (active) =>
    `px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
      active ? "bg-zinc-900 text-white border border-zinc-800" : "text-zinc-500 hover:text-zinc-300"
    }`;

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans antialiased">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black">Teacher Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create a team per class, share the invite code, and review what students upload.
          </p>
        </div>

        <form onSubmit={createTeam} className="flex gap-3 max-w-xl">
          <input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            maxLength={80}
            placeholder="New team name (e.g. CS301 - Section A)"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 text-white font-bold px-5 rounded-xl transition flex items-center gap-2 text-sm"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create
          </button>
        </form>

        {teams.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed border-zinc-800 rounded-2xl">
            <Users size={30} className="mx-auto text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-600">No teams yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => openTeam(team)}
                className={`bg-zinc-950 border rounded-2xl p-4 cursor-pointer transition ${
                  team.id === activeId ? "border-blue-500" : "border-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold truncate">{team.name}</p>
                  {team.pendingCount > 0 && (
                    <span className="shrink-0 text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full">
                      {team.pendingCount} pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {team._count.members} members · {team._count.resources} uploads
                </p>

                <div
                  className="mt-3 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <code className="flex-1 text-xs font-mono tracking-wider text-zinc-300 truncate">
                    {team.inviteCode}
                  </code>
                  <button
                    onClick={() => copyCode(team.inviteCode)}
                    aria-label="Copy invite code"
                    className="text-zinc-500 hover:text-white transition"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => regenerate(team)}
                    aria-label="Generate new invite code"
                    className="text-zinc-500 hover:text-amber-400 transition"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTeam && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold truncate">{activeTeam.name}</h2>
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 self-start">
                <button onClick={() => setTab("review")} className={tabClass(tab === "review")}>
                  Review queue ({pending.length})
                </button>
                <button onClick={() => setTab("all")} className={tabClass(tab === "all")}>
                  All uploads ({resources.length})
                </button>
                <button onClick={() => setTab("members")} className={tabClass(tab === "members")}>
                  Members ({members.length})
                </button>
              </div>
            </div>

            {loadingTeam ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            ) : tab === "members" ? (
              members.length === 0 ? (
                <p className="text-sm text-zinc-600 text-center py-10">
                  No one has joined yet. Share the invite code above.
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{m.email}</p>
                        <p className="text-[11px] text-zinc-600">
                          Joined {new Date(m.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => removeMember(m)}
                        className="shrink-0 ml-3 flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition"
                      >
                        <UserMinus size={14} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : visibleResources.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl">
                <Inbox size={28} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-600">
                  {tab === "review" ? "Nothing waiting for review. You're all caught up." : "No uploads in this team yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleResources.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{r.title}</p>
                        <span
                          className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        {r.category} · by {r.ownerEmail} · {timeAgo(r.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => viewFile(r)}
                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition"
                      >
                        <ExternalLink size={12} /> View
                      </button>
                      {r.status !== "APPROVED" && (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r, "APPROVED")}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                      )}
                      {r.status !== "FLAGGED" && (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r, "FLAGGED")}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          <Flag size={12} /> Flag
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
