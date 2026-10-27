import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Users, KeyRound, Loader2, LogOut, GraduationCap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import API from "../api";
import Navbar from "../components/Navbar";
import { useUser } from "../utils/UserContext";

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
    <div className="min-h-screen bg-[#09090b] text-white font-sans antialiased">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black">Your Teams</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Join a class with the invite code from your teacher to share notes privately with it.
          </p>
        </div>

        {isTeacher && (
          <Link
            to="/teacher"
            className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-2xl px-4 py-3 hover:bg-indigo-500/15 transition"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <GraduationCap size={16} /> Manage the teams you teach
            </span>
            <ArrowRight size={16} />
          </Link>
        )}

        <form onSubmit={joinTeam} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
            Join with invite code
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <KeyRound size={16} className="absolute left-3 top-3 text-zinc-500" />
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4E5F6"
                maxLength={20}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-wider text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={joining || !inviteCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold px-5 rounded-xl transition flex items-center gap-2"
            >
              {joining ? <Loader2 size={16} className="animate-spin" /> : "Join"}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Teams you've joined ({joined.length})
          </h2>

          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="animate-spin text-blue-500" />
            </div>
          ) : joined.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl">
              <Users size={28} className="mx-auto text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-600">You haven't joined any teams yet.</p>
            </div>
          ) : (
            joined.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-2xl p-4 hover:border-zinc-800 transition"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-100 truncate">{team.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Taught by {team.teacherName} · joined {new Date(team.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => leaveTeam(team)}
                  className="shrink-0 ml-3 flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition"
                >
                  <LogOut size={14} /> Leave
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Teams;
