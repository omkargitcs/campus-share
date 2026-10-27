import React from "react";
import { Toaster } from "sonner";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import your pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <>
      <Toaster
        theme="dark"
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid #27272a",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "12px",
          },
        }}
      />

      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
