function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#F8F8F8] p-6 animate-pulse">
      {/* Card title */}
      <div className="h-4 w-36 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-52 rounded bg-slate-200" />
      {/* Chart / content area */}
      <div className="mt-4 h-52 w-full rounded-xl bg-slate-200" />
      {/* Legend row */}
      <div className="mt-4 flex justify-center gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-2.5 w-14 rounded bg-slate-200" />
            <div className="h-2 w-8 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetricsLoading() {
  return (
    <main className="mx-auto max-w-6xl">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 animate-pulse">
        {/* Page title */}
        <div className="h-7 w-64 rounded bg-slate-200" />

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </main>
  );
}
