import React, { useEffect, useState } from "react";
import CampusShareLogo from "./CampusShareLogo";
import ThemeToggle from "./ThemeToggle";
import { spineFor } from "../utils/spines";

const SAMPLE = [
  { title: "Operating Systems, Unit 1", category: "Notes" },
  { title: "Database System Concepts", category: "Book" },
  { title: "DBMS question papers 2019 to 2024", category: "PYQ" },
  { title: "Computer Networks, Unit 3", category: "Notes" },
];

// A decorative slice of the catalogue. After a beat, one row gets marked: the one moment of motion.
const Shelf = () => {
  const [marked, setMarked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMarked(true), 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <ul aria-hidden="true" className="max-w-md border-t border-white/15 text-white">
      {SAMPLE.map((r, i) => (
        <li key={r.title} data-marked={marked && i === 2} className="row !border-white/15">
          <span className="spine" style={{ background: spineFor(r.category) }} />
          <span className="mark" />
          <div className="content flex items-baseline justify-between gap-4 py-3.5 pl-6 pr-4">
            <span className="truncate font-medium" style={{ color: marked && i === 2 ? "var(--fg)" : undefined }}>{r.title}</span>
            <span className="shrink-0 text-sm" style={{ color: marked && i === 2 ? "var(--muted)" : "rgba(255,255,255,.6)" }}>{r.category}</span>
          </div>
        </li>
      ))}
    </ul>
  );
};

// Split screen: ink panel with the pitch on the left, the form on the right.
const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
    <aside className="flex flex-col justify-between gap-12 bg-rail px-6 py-6 text-white lg:px-14 lg:py-12">
      <div className="flex items-center gap-2.5">
        <CampusShareLogo className="h-9 w-9" />
        <span className="font-display text-xl font-bold tracking-tight">Campus Share</span>
      </div>

      <div className="hidden lg:block">
        <h2 className="max-w-[16ch] text-5xl font-bold leading-[1.05] xl:text-6xl">Everything your class shares, shelved in one place.</h2>
        <p className="mt-5 max-w-[44ch] text-lg text-white/70">
          Notes, books and past papers from your campus, plus a private shelf for each class your teacher sets up.
        </p>
      </div>

      <div className="hidden lg:block">
        <Shelf />
      </div>
    </aside>

    <main className="relative flex items-center justify-center px-5 py-10 sm:px-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-8 border-t border-line pt-5 text-sm text-muted">{footer}</p>
      </div>
    </main>
  </div>
);

export default AuthLayout;
