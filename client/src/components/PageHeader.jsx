import React from "react";

const PageHeader = ({ title, children, actions }) => (
  <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
    <div className="min-w-0">
      <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
      {children && <p className="mt-2 max-w-[60ch] text-muted">{children}</p>}
    </div>
    {actions}
  </header>
);

export default PageHeader;
