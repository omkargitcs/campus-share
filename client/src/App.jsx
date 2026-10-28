import React from "react";
import { Toaster } from "sonner";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import TeacherDashboard from "./pages/TeacherDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { getStoredUser } from "./utils/auth";
import { useTheme } from "./utils/theme";

// Login/Register are for logged-out visitors only: if you already have a valid session, skip them.
// NOTE: the session is read on every render. Reading it once at start-up (as the old code did)
// is what made login "bounce back" to /login after a successful sign-in.
const PublicOnly = ({ children }) =>
  getStoredUser() ? <Navigate to="/dashboard" replace /> : children;

function App() {
  const { theme } = useTheme();
  return (
    <>
      <Toaster
        theme={theme}
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--fg)",
            borderRadius: "8px",
            padding: "12px 14px",
            fontFamily: "var(--font-sans)",
          },
        }}
      />

      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
