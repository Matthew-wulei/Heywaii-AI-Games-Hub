export default function Loading() {
  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto pb-12 animate-pulse">
      
      {/* Hero Skeleton */}
      <div className="relative w-full rounded-3xl overflow-hidden aspect-[21/9] md:aspect-[21/8] bg-white/5 mb-8">
        <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 xl:p-16 max-w-2xl gap-4">
          <div className="w-32 h-6 bg-white/10 rounded-full mb-2"></div>
          <div className="w-3/4 h-12 md:h-16 bg-white/10 rounded-xl mb-2"></div>
          <div className="w-full h-4 bg-white/10 rounded-full"></div>
          <div className="w-full h-4 bg-white/10 rounded-full"></div>
          <div className="w-2/3 h-4 bg-white/10 rounded-full mb-6"></div>
          <div className="flex gap-4">
            <div className="w-32 h-12 bg-white/10 rounded-full"></div>
            <div className="w-24 h-12 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Data Panel Skeleton */}
      <div className="mb-10">
        <div className="w-48 h-8 bg-white/5 rounded-lg mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 h-28 flex flex-col justify-between">
              <div className="w-1/2 h-4 bg-white/10 rounded"></div>
              <div className="w-3/4 h-8 bg-white/10 rounded mt-auto"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-col gap-6">
        {/* Tabs Skeleton */}
        <div className="flex items-center gap-6 border-b border-white/5 pb-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-6 bg-white/5 rounded mb-2"></div>
          ))}
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col w-full bg-white/5 rounded-2xl overflow-hidden border border-white/5 h-[320px]">
              <div className="w-full aspect-video bg-white/5"></div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="w-3/4 h-5 bg-white/10 rounded"></div>
                <div className="w-1/4 h-4 bg-white/10 rounded"></div>
                <div className="w-full h-3 bg-white/10 rounded mt-2"></div>
                <div className="w-5/6 h-3 bg-white/10 rounded"></div>
                <div className="mt-auto flex justify-between pt-3 border-t border-white/5">
                  <div className="w-1/3 h-3 bg-white/10 rounded"></div>
                  <div className="w-1/4 h-3 bg-white/10 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}