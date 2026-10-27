import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import API from "../api";
import { getStoredUser } from "../utils/auth";
import { UserContext } from "../utils/UserContext";

// <ProtectedRoute>                       -> any logged-in user
// <ProtectedRoute roles={["TEACHER"]}>   -> only those roles (UI guard; the API enforces it for real)
const ProtectedRoute = ({ roles, children }) => {
  const [state, setState] = useState(() => ({ user: getStoredUser(), verified: false }));

  // Confirm email + role with the server (covers "promoted to teacher since last login")
  useEffect(() => {
    if (!state.user) return;
    let cancelled = false;
    API.get("/users/profile")
      .then(({ data }) => {
        if (cancelled) return;
        localStorage.setItem("user", JSON.stringify({ email: data.email, role: data.role }));
        setState((s) => ({ user: { ...s.user, email: data.email, role: data.role }, verified: true }));
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, verified: true }));
      });
    return () => {
      cancelled = true;
    };
    // run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state.user) return <Navigate to="/login" replace />;

  if (roles) {
    if (!state.verified) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      );
    }
    if (!roles.includes(state.user.role)) return <Navigate to="/dashboard" replace />;
  }

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
};

export default ProtectedRoute;
