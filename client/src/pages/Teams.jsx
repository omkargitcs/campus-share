import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogOut, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import API from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { useUser } from "../utils/UserContext";
import { teamSpine } from "../utils/spines";

const Teams = () => {
  const { user } = useUser();
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await API.get("/teams/mine");
      setJoined(data.joined);
    } catch {
      toast.error("Failed to load your teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const joinTeam = async (e) => {
    e.preventDefault();
    const code = inviteCode.trim();
    if (!code) return;
    setJoining(true);
    try {
      const { data } = await API.post("/teams/join", { inviteCode: code });
      toast.success(data.message);
      setInviteCode("");
      load();
    } catch (err) {
      toast.error(
        err.response?.status === 429
          ? "Too many attempts. Please wait a few minutes."
          : err.response?.data?.message || "Invalid invite code",
      );
    } finally {
      setJoining(false);
    }
  };

  const leaveTeam = async (team) => {
    if (!window.confirm(`Leave "${team.name}"? You'll lose access to its shared resources.`)) return;
    try {
      await API.delete(`/teams/${team.id}/leave`);
      setJoined((prev) => prev.filter((t) => t.id !== team.id));
      toast.success(`Left ${team.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not leave team");
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl">
        <PageHeader
          title="Teams"
          actions={
            isTeacher && (
              <Link to="/teacher" className="btn btn-quiet">
                <GraduationCap size={17} /> Manage teams you teach
              </Link>
            )
          }
        >
          A team is a private shelf for one class. Join with the invite code your teacher gave you.
        </PageHeader>

        <form onSubmit={joinTeam} className="mb-10">
          <label htmlFor="invite" className="label">Invite code</label>
          <div className="flex gap-2">
            <input
              id="invite"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="A1B2C3D4E5F6"
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
              className="field font-mono tracking-wider"
            />
            <button type="submit" disabled={joining || !inviteCode.trim()} className="btn btn-primary !h-11 px-6">
              {joining ? <Loader2 size={16} className="animate-spin" /> : "Join team"}
            </button>
          </div>
        </form>

        <div className="mb-2 flex items-baseline justify-between border-b border-line pb-2">
          <h2 className="text-xl font-semibold">Teams you've joined</h2>
          <span className="text-sm text-muted">{joined.length}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-accent" />
          </div>
        ) : joined.length === 0 ? (
          <p className="py-10 text-muted">You haven't joined a team yet. Enter an invite code above to join your first class.</p>
        ) : (
          <ul>
            {joined.map((team) => (
              <li key={team.id} className="row">
                <span className="spine" style={{ background: teamSpine(team.name) }} />
                <div className="content flex items-center gap-3 py-3.5 pl-6 pr-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{team.name}</p>
                    <p className="truncate text-sm text-muted">
                      Taught by {team.teacherName}. Joined {new Date(team.joinedAt).toLocaleDateString()}.
                    </p>
                  </div>
                  <button type="button" onClick={() => leaveTeam(team)} aria-label={`Leave ${team.name}`} className="btn btn-sm btn-ghost hover:!text-danger">
                    <LogOut size={14} /> Leave
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
};

export default Teams;
