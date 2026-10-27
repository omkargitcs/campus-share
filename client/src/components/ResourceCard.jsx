import { useEffect } from "react";
import { Download, Eye, User, FileText } from "lucide-react";
import API from "../../api";

const ResourceCard = ({ resource }) => {
  // Views tracking can still run quietly in the background when the card mounts
  useEffect(() => {
    const incrementView = async () => {
      try {
        await API.patch(`/resources/stats/${resource.id}`, { type: "views" });
      } catch (err) {
        // If it throws a 401 here, it's safe to ignore, as views don't block the file opening
        console.error("Failed to update view stats:", err);
      }
    };
    if (resource?.id) incrementView();
  }, [resource.id]);

  const handleDownloadRedirect = () => {
    // Determine the base API link path directly from your setup environment
    const backendBaseUrl =
      import.meta.env.VITE_API_URL ||
      "https://campus-share-6yaz.onrender.com/api";

    // Build the direct download access URL string
    const targetUrl = `${backendBaseUrl}/resources/download/${resource.id}`;

    // Fire it open in a separate window tab—the backend will increment the stat and handle the path instantly
    window.open(targetUrl, "_blank", "noopener,noreferrer");
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

      {/* Stats Section */}
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
            {resource.owner?.email
              ? resource.owner.email.split("@")[0]
              : "User"}
          </span>
        </div>

        <button
          onClick={handleDownloadRedirect}
          className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-white active:scale-95 transition shadow-sm"
        >
          <Download size={14} /> View
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;
