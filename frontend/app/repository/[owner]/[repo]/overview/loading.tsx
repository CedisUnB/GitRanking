export default function OverviewLoading() {
  return (
    <main className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 animate-pulse">
            <div className="h-6 w-40 rounded bg-slate-200" />
            <div className="mt-4 h-24 rounded-xl bg-slate-100" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-200" />
              <div className="h-6 w-32 rounded bg-slate-200" />
            </div>
            <div className="mt-3 h-3.5 w-72 rounded bg-slate-200" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl bg-slate-100 p-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-full bg-slate-200" />
                    <div className="h-3 w-14 rounded bg-slate-200" />
                  </div>
                  <div className="mt-3 h-8 w-10 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 animate-pulse">
            <div className="mx-auto h-6 w-40 rounded bg-slate-200" />
            <div className="mt-4 flex gap-4">
              <div className="h-24 w-24 shrink-0 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-3">
                <div className="h-16 rounded-xl bg-slate-100" />
                <div className="h-10 rounded-xl bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
