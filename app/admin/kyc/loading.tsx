export default function Loading() {
  return (
    <div className="admin-page admin-page--spacious animate-pulse" dir="rtl">
      {/* Header skeleton */}
      <div className="bg-white border-b border-slate-200 px-6 lg:px-10 py-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-3">
          <div className="h-3 w-32 bg-slate-100 rounded-full" />
          <div className="h-7 w-56 bg-slate-200 rounded-lg" />
          <div className="h-3 w-80 bg-slate-100 rounded-full" />
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-56 bg-slate-100 rounded-lg" />
          <div className="h-11 w-32 bg-slate-100 rounded-lg" />
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-8 flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-100 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-slate-100 rounded-full" />
                <div className="h-7 w-28 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="px-8 py-5 flex items-center gap-6">
                <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                <div className="flex-1 h-4 bg-slate-100 rounded-full" />
                <div className="w-24 h-4 bg-slate-100 rounded-full" />
                <div className="w-20 h-6 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
