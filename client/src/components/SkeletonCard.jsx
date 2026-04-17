const SkeletonCard = () => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 w-full animate-pulse">
      <div className="w-full h-32 bg-zinc-800 rounded-xl mb-4"></div>
      <div className="h-4 bg-zinc-800 rounded-md w-3/4 mb-2"></div>

      <div className="h-3 bg-zinc-800 rounded-md w-1/2 mb-4"></div>

      <div className="flex justify-between items-center">
        <div className="h-8 w-20 bg-zinc-800 rounded-lg"></div>
        <div className="h-6 w-6 bg-zinc-800 rounded-full"></div>
      </div>
    </div>
  );
};
export default SkeletonCard;
