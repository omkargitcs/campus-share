import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../utils/theme";

// variant: "rail" (labelled row in the sidebar) | "icon" (compact button)
const ThemeToggle = ({ variant = "icon", className = "" }) => {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const Icon = dark ? Sun : Moon;
  const label = dark ? "Switch to light theme" : "Switch to dark theme";

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white ${className}`}
      >
        <Icon size={18} />
        {dark ? "Light theme" : "Dark theme"}
      </button>
    );
  }

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={`icon-btn ${className}`}>
      <Icon size={18} />
    </button>
  );
};

export default ThemeToggle;
