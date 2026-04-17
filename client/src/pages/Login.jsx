import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import API from "../api";
import CampusShareLogo from "../components/CampusShareLogo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      toast.success("Welcome back to Campus Share!");
      window.location.href = "/Dashboard";
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[20%] left-[20%] w-[35%] h-[35%] bg-blue-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] bg-emerald-600/5 blur-[120px] rounded-full"></div>

      {/* Main Auth Card */}
      <div className="relative w-full max-w-lg bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl p-10 md:p-12 rounded-3xl shadow-2xl">
        <div className="text-center mb-10">
          <CampusShareLogo className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
            Welcome Back
          </h1>
          <p className="text-zinc-500 text-base mt-3 max-w-sm mx-auto">
            Log in to access your notes, books, and university resources.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="email"
                required
                placeholder="name@mithibai.ac.in"
                className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder:text-zinc-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <a
                href="#"
                className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
              >
                Forgot?
              </a>
            </div>
            <div className="relative group">
              <Lock
                className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder:text-zinc-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Sign In <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-zinc-800/50 pt-6">
          <p className="text-zinc-500 text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
