import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Copy, RefreshCw, CheckCircle2, Flag, ExternalLink, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import API from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { openResource } from "../utils/openResource";
import { timeAgo } from "../utils/format";
import { spineFor, teamSpine } from "../utils/spines";

const STATUS = {
  PENDING: { label: "Awaiting review", cls: "text-wait" },
  APPROVED: { label: "Approved", cls: "text-ok" },
  FLAGGED: { label: "Flagged", cls: "text-danger" },
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
      const [res, mem] = await Promise.all([API.get(`/teams/${team.id}/resources`), API.get(`/teams/${team.id}/members`)]);
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
  const TABS = [
    ["review", `Review queue (${pending.length})`],
    ["all", `All uploads (${resources.length})`],
    ["members", `Members (${members.length})`],
  ];

  return (
    <AppShell wide>
      <PageHeader title="Teacher">Create a team for each class, share its invite code, and review what students upload.</PageHeader>

      <form onSubmit={createTeam} className="mb-10 max-w-xl">
        <label htmlFor="team-name" className="label">New team</label>
        <div className="flex gap-2">
          <input id="team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} maxLength={80} placeholder="CS301, Section A" className="field" />
          <button type="submit" disabled={creating} className="btn btn-primary !h-11 px-5">
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create team
          </button>
        </div>
      </form>

      {teams.length === 0 ? (
        <p className="border-t border-line py-10 text-muted">You haven't created a team yet. Name your first class above.</p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <section aria-label="Your teams">
            <div className="mb-1 flex items-baseline justify-between border-b border-line pb-2">
              <h2 className="text-xl font-semibold">Your teams</h2>
              <span className="text-sm text-muted">{teams.length}</span>
            </div>
            <ul>
              {teams.map((team) => {
                const active = team.id === activeId;
                return (
                  <li key={team.id} data-marked={active} className="row">
                    <span className="spine" style={{ background: teamSpine(team.name) }} />
                    <span className="mark" />
                    <div className="content py-3 pl-6 pr-3">
                      <div className="flex items-center justify-between gap-3">
                        <button type="button" aria-pressed={active} onClick={() => openTeam(team)} className="stretch min-w-0 truncate text-left font-semibold">
                          {team.name}
                        </button>
                        {team.pendingCount > 0 && <span className="shrink-0 text-xs font-semibold text-wait">{team.pendingCount} to review</span>}
                      </div>
                      <p className="text-sm text-muted">
                        {team._count.members} members, {team._count.resources} uploads
                      </p>
                      <div className="above mt-2 flex items-center rounded-md border border-line bg-surface pl-2.5">
                        <code className="flex-1 truncate font-mono text-xs tracking-wider">{team.inviteCode}</code>
                        <button type="button" onClick={() => copyCode(team.inviteCode)} aria-label={`Copy invite code for ${team.name}`} className="icon-btn !h-8 !w-8">
                          <Copy size={14} />
                        </button>
                        <button type="button" onClick={() => regenerate(team)} aria-label={`Generate a new invite code for ${team.name}`} className="icon-btn !h-8 !w-8">
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Team details" className="min-w-0">
            {!activeTeam ? (
              <p className="py-3 text-muted">Pick a team to review its uploads and manage its members.</p>
            ) : (
              <>
                <h2 className="mb-1 truncate text-2xl font-semibold">{activeTeam.name}</h2>
                <div role="tablist" aria-label="Team sections" className="mb-1 flex gap-6 overflow-x-auto border-b border-line">
                  {TABS.map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className="tab">
                      {label}
                    </button>
                  ))}
                </div>

                {loadingTeam ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-accent" />
                  </div>
                ) : tab === "members" ? (
                  members.length === 0 ? (
                    <p className="py-10 text-muted">No one has joined yet. Share the invite code with your class.</p>
                  ) : (
                    <ul>
                      {members.map((m) => (
                        <li key={m.id} className="row">
                          <div className="content flex items-center gap-3 py-3 pr-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{m.email}</p>
                              <p className="text-sm text-muted">Joined {new Date(m.joinedAt).toLocaleDateString()}</p>
                            </div>
                            <button type="button" onClick={() => removeMember(m)} aria-label={`Remove ${m.email}`} className="btn btn-sm btn-danger">
                              <UserMinus size={14} /> Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                ) : visibleResources.length === 0 ? (
                  <p className="py-10 text-muted">{tab === "review" ? "Nothing is waiting for review. You're all caught up." : "No uploads in this team yet."}</p>
                ) : (
                  <ul>
                    {visibleResources.map((r) => {
                      const st = STATUS[r.status] || STATUS.PENDING;
                      return (
                        <li key={r.id} className="row">
                          <span className="spine" style={{ background: spineFor(r.category) }} />
                          <div className="content flex flex-col gap-3 py-3.5 pl-6 pr-3 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3">
                                <p className="truncate font-semibold">{r.title}</p>
                                <span className={`shrink-0 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                              </div>
                              <p className="truncate text-sm text-muted">
                                {r.category} · by {r.ownerEmail} · {timeAgo(r.createdAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button type="button" onClick={() => viewFile(r)} className="btn btn-sm btn-quiet">
                                <ExternalLink size={13} /> View
                              </button>
                              {r.status !== "APPROVED" && (
                                <button type="button" disabled={busyId === r.id} onClick={() => setStatus(r, "APPROVED")} className="btn btn-sm btn-primary">
                                  <CheckCircle2 size={13} /> Approve
                                </button>
                              )}
                              {r.status !== "FLAGGED" && (
                                <button type="button" disabled={busyId === r.id} onClick={() => setStatus(r, "FLAGGED")} className="btn btn-sm btn-danger">
                                  <Flag size={13} /> Flag
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
};

export default TeacherDashboard;
