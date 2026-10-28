import React from "react";

// Three spines on a shelf with a highlighter stroke across them.
const CampusShareLogo = ({ className = "w-9 h-9" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <rect x="8" y="14" width="14" height="44" rx="2.5" fill="var(--sp-notes)" />
    <rect x="25" y="6" width="14" height="52" rx="2.5" fill="var(--sp-book)" />
    <rect x="42" y="20" width="14" height="38" rx="2.5" fill="var(--sp-pyq)" />
    <rect x="3" y="30" width="58" height="11" rx="2.5" fill="#FFE24A" opacity="0.93" transform="rotate(-3 32 35)" />
  </svg>
);

export default CampusShareLogo;
