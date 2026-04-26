export default function OverviewLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 animate-pulse">
        {/* Header: icon + title */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="h-6 w-32 rounded bg-slate-200" />
        </div>

        {/* Sprint goal subtitle */}
        <div className="mt-3 h-3.5 w-72 rounded bg-slate-200" />

        {/* 2x2 status grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl bg-slate-100 p-4">
              {/* Icon + label row */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-slate-200" />
                <div className="h-3 w-14 rounded bg-slate-200" />
              </div>
              {/* Count */}
              <div className="mt-3 h-8 w-10 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
