export default function Loading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-200" />
            <div className="h-8 w-32 rounded-lg bg-slate-200" />
          </div>
          <div className="h-4 w-48 rounded-full bg-slate-100" />
        </div>
        <div className="h-[52px] w-36 rounded-2xl bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4"
          >
            <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100 sm:h-10 sm:w-10" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-16 rounded-full bg-slate-100" />
              <div className="h-5 w-10 rounded bg-slate-200 sm:h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="surface-card-soft flex flex-col items-stretch gap-3 p-4 md:flex-row md:items-center">
        <div className="h-12 w-full flex-1 rounded-2xl bg-slate-100" />
        <div className="no-scrollbar -mx-4 flex w-full items-center gap-2 overflow-hidden px-4 md:mx-0 md:w-auto md:px-0">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-10 w-20 shrink-0 rounded-full bg-slate-100" />
          ))}
        </div>
      </div>

      {/* Mobile card skeletons */}
      <div className="grid gap-3 sm:hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="surface-card flex flex-col gap-3 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                <div className="h-3 w-12 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-1/2 rounded-full bg-slate-100" />
              <div className="h-3 w-1/3 rounded-full bg-slate-100" />
            </div>
            <div className="-mx-4 -mb-4 h-9 border-t border-slate-100" />
          </div>
        ))}
      </div>

      {/* Desktop table skeletons */}
      <div className="surface-card hidden min-h-[400px] overflow-hidden sm:block">
        <div className="grid grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="mx-auto h-3 w-8 rounded bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-5">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                <div className="h-3 w-12 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-20 rounded-lg bg-slate-100" />
              <div className="hidden flex-1 space-y-2 md:block">
                <div className="h-3 w-1/2 rounded-full bg-slate-100" />
                <div className="h-3 w-1/3 rounded-full bg-slate-100" />
              </div>
              <div className="h-4 w-4 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
