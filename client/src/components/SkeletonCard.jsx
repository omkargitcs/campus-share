import React from "react";

const SkeletonCard = () => {
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl animate-pulse">
      <div>
        {/* Banner Thumbnail Image Placeholder */}
        <div className="w-full h-40 bg-zinc-900 border-b border-zinc-900/40 relative">
          {/* Tag Placeholder */}
          <div className="absolute top-3 left-3 w-20 h-4 bg-zinc-800 rounded"></div>
        </div>

        {/* Content Meta Text Body Placeholders */}
        <div className="p-4">
          <div className="flex justify-between items-center gap-2 mb-2">
            {/* Title Line */}
            <div className="h-4 bg-zinc-900 rounded-md w-2/3"></div>
            {/* Price Badge */}
            <div className="h-4 bg-zinc-900 rounded-md w-10"></div>
          </div>

          {/* Two-line clamped Description Block */}
          <div className="space-y-2 mt-2">
            <div className="h-3 bg-zinc-900 rounded-md w-full"></div>
            <div className="h-3 bg-zinc-900 rounded-md w-4/5"></div>
          </div>
        </div>
      </div>

      {/* Footer Controls Row Placeholder */}
      <div className="p-4 pt-0 mt-2 flex items-center justify-between border-t border-zinc-900/50">
        {/* Total Hits Text */}
        <div className="h-3 bg-zinc-900 rounded-md w-16 mt-3"></div>
        {/* Interactive View Action Button */}
        <div className="h-7 bg-zinc-900 rounded-lg w-16 mt-3"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
