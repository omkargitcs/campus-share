import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Tailwind v4 styles
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
