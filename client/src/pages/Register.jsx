import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, Loader2, Rocket } from "lucide-react";
import API from "../api";

const Register = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await API.post("/auth/register", formData);
      alert("Account created successfully! Redirecting to login...");
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Try a different email.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Rocket className="text-emerald-500" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
            Join CampusShare
          </h2>
          <p className="text-zinc-500 mt-2 text-sm">
            Create an account to start sharing notes
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 ml-1">
              University Email
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors"
                size={18}
              />
              <input
                type="email"
                required
                className="w-full bg-[#09090b] text-zinc-100 pl-10 pr-4 py-3 border border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-700"
                placeholder="yourname@college.edu"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 ml-1">
              Choose Password
            </label>
            <div className="relative group">
              <Lock
                className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors"
                size={18}
              />
              <input
                type="password"
                required
                className="w-full bg-[#09090b] text-zinc-100 pl-10 pr-4 py-3 border border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-700"
                placeholder="••••••••"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <UserPlus size={20} /> Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline transition-colors"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
