import { jwtDecode } from "jwt-decode";

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const logout = () => {
  clearSession();
  window.location.href = "/login";
};

// UI-only convenience. The SERVER re-checks the role from the database on every
// request, so editing localStorage can never grant real access.
export const getStoredUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      clearSession();
      return null;
    }
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem("user") || "{}") || {};
    } catch {
      stored = {};
    }
    return {
      id: decoded.id,
      role: stored.role || decoded.role || "STUDENT",
      email: stored.email || "",
    };
  } catch {
    clearSession();
    return null;
  }
};
