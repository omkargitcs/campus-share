import React from "react";

const CampusShareLogo = ({ className = "w-20 h-20" }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
        <stop offset="100%" stopColor="#10b981" /> {/* Emerald-500 */}
      </linearGradient>
    </defs>

    {/* The Hexagon Frame */}
    <path
      d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z"
      stroke="url(#logoGradient)"
      strokeWidth="5"
      strokeLinejoin="round"
      className="drop-shadow-sm"
    />

    {/* The Branding Text with Gradient Fill */}
    <text
      x="50%"
      y="58%"
      textAnchor="middle"
      fill="url(#logoGradient)"
      fontSize="28"
      fontWeight="900"
      fontFamily="Inter, system-ui, sans-serif"
      letterSpacing="-1.5"
    >
      CS
    </text>

    {/* Small Tech Accents */}
    <circle cx="50" cy="5" r="3" fill="#3b82f6" />
    <circle cx="11" cy="72.5" r="2" fill="#10b981" />
    <circle cx="89" cy="72.5" r="2" fill="#10b981" />
  </svg>
);

export default CampusShareLogo;
