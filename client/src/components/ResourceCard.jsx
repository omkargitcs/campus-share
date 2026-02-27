import { Download, Tag, User } from "lucide-react";

const ResourceCard = ({ resource }) => (
  <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">
        {resource.category}
      </span>
      <span className="text-emerald-400 font-mono font-bold">
        ${resource.price}
      </span>
    </div>

    <h3 className="text-lg font-semibold text-zinc-100 mb-2">
      {resource.title}
    </h3>
    <p className="text-zinc-400 text-sm mb-6 line-clamp-2 leading-relaxed">
      {resource.description}
    </p>

    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
      <div className="flex items-center gap-2 text-zinc-500 text-xs">
        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
          <User size={12} />
        </div>
        <span>{resource.owner?.email.split("@")[0]}</span>
      </div>
      <button className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-white transition shadow-sm">
        <Download size={14} /> View
      </button>
    </div>
  </div>
);
