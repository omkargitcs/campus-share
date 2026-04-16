import { Download, Eye, User, FileText } from "lucide-react";
import axios from "axios";

const ResourceCard = ({ resource }) => {
  const handleAction = async (type) => {
    const url = resource.fileUrl;
    if (!url) return alert("No file attached to this resource.");

    try {
      // 1. Update the stats in the Database
      // Replace with your actual API base URL if needed
      await axios.patch(`/api/resources/stats/${resource.id}`, { type });

      // 2. Handle the File Opening Logic
      const isOfficeDoc = url.match(/\.(ppt|pptx|doc|docx)$/i);

      if (isOfficeDoc) {
        // Use Google Docs Viewer for Office files to prevent black screens
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        window.open(viewerUrl, "_blank", "noopener,noreferrer");
      } else {
        // PDFs and Images open normally in a new tab
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to update stats or open file:", err);
    }
  };

  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">
          {resource.category}
        </span>
        <span className="text-emerald-400 font-mono font-bold text-sm">
          {resource.price === 0 ? "FREE" : `$${resource.price}`}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-blue-400 transition-colors">
        {resource.title}
      </h3>
      <p className="text-zinc-400 text-sm mb-6 line-clamp-2 leading-relaxed h-10">
        {resource.description || "No description provided."}
      </p>

      {/* Stats Section: Views and Downloads */}
      <div className="flex gap-4 mb-4 text-[11px] font-medium text-zinc-500">
        <div className="flex items-center gap-1">
          <Eye size={12} className="text-zinc-600" />
          <span>{resource.views || 0} views</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText size={12} className="text-zinc-600" />
          <span>{resource.downloads || 0} opens</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <User size={14} className="text-zinc-300" />
          </div>
          <span className="truncate max-w-[80px]">
            {resource.owner?.email.split("@")[0]}
          </span>
        </div>

        {/* Action Button: Triggers the handleAction function */}
        <button
          onClick={() => handleAction("downloads")}
          className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-white active:scale-95 transition shadow-sm"
        >
          <Download size={14} /> View
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;
