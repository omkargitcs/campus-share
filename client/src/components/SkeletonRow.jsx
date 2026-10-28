import React from "react";

const SkeletonRow = () => (
  <li className="relative flex items-center gap-4 border-b border-line py-4 pl-5 pr-3" aria-hidden="true">
    <span className="absolute inset-y-0 left-0 w-1.5 skeleton !rounded-none" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-4 w-2/5" />
      <div className="skeleton h-3 w-1/4" />
    </div>
    <div className="skeleton hidden h-4 w-16 lg:block" />
    <div className="skeleton h-8 w-20" />
  </li>
);

export default SkeletonRow;
