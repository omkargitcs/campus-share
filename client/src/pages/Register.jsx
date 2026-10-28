import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import API from "../api";
import AuthLayout from "../components/AuthLayout";

const Register = () => {
  const [formData, setFormData] = useState({ email: "", password: "", teacherCode: "" });
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const set = (key) => (e) => setFormData((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { email: formData.email.trim(), password: formData.password };
      if (isTeacher && formData.teacherCode.trim()) payload.teacherCode = formData.teacherCode.trim();
      await API.post("/auth/register", payload);
      toast.success("Account created! Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register with your university email to start sharing."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-link hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p role="alert" className="notice-error">{error}</p>}

        <div>
          <label htmlFor="reg-email" className="label">University email</label>
          <input id="reg-email" type="email" required autoComplete="email" placeholder="yourname@mithibai.ac.in" className="field" value={formData.email} onChange={set("email")} />
        </div>

        <div>
          <label htmlFor="reg-pass" className="label">Password</label>
          <input id="reg-pass" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="field" value={formData.password} onChange={set("password")} />
          <p className="hint mt-1.5">At least 8 characters.</p>
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" checked={isTeacher} onChange={(e) => setIsTeacher(e.target.checked)} className="h-4 w-4 accent-[var(--cobalt)]" />
            I'm a teacher
          </label>
          {isTeacher && (
            <div className="mt-3">
              <label htmlFor="reg-code" className="label">Teacher access code</label>
              <input id="reg-code" type="password" autoComplete="off" className="field" value={formData.teacherCode} onChange={set("teacherCode")} />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full !h-11">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
