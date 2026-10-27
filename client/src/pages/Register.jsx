import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import API from "../api";
import CampusShareLogo from "../components/CampusShareLogo"; // Make sure this exists!

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
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-blue-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-emerald-600/5 blur-[120px] rounded-full"></div>

      {/* Main Card */}
      <div className="relative w-full max-w-lg bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl p-10 md:p-12 rounded-3xl shadow-2xl">
        <div className="text-center mb-10">
          <CampusShareLogo className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
            Join CampusShare
          </h1>
          <p className="text-zinc-500 text-base mt-3 max-w-sm mx-auto">
            Create an account to start sharing notes and resources with your
            campus.
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
                className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="email"
                required
                className="w-full bg-[#09090b] text-zinc-100 pl-10 pr-4 py-3 border border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-700"
                placeholder="yourname@mithibai.ac.in"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock
                className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="password"
                required
                className="w-full bg-[#09090b] text-zinc-100 pl-10 pr-4 py-3 border border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-700"
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

        <div className="mt-10 text-center border-t border-zinc-800/50 pt-6">
          <p className="text-zinc-500 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
