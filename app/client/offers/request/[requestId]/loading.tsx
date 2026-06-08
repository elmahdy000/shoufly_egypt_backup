export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 sm:space-y-8" dir="rtl">
      <div className="flex flex-col gap-4 border-b border-border pb-5 animate-pulse md:flex-row md:items-center md:justify-between md:pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-200 sm:h-11 sm:w-11" />
            <div className="h-7 w-40 rounded-lg bg-slate-200" />
          </div>
          <div className="h-3.5 w-72 rounded-full bg-slate-100" />
        </div>
        <div className="h-9 w-56 rounded-xl bg-slate-100" />
      </div>

      <div className="grid gap-4 sm:gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:gap-6">
              <div className="h-28 w-full rounded-2xl bg-slate-100 md:w-56" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/3 rounded-full bg-slate-100" />
                    <div className="h-3 w-1/4 rounded-full bg-slate-100" />
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100" />
                <div className="h-3 w-5/6 rounded-full bg-slate-100" />
                <div className="h-3 w-2/3 rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
