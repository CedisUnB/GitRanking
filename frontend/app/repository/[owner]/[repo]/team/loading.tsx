export default function TeamLoading() {
  return (
    <main className="mx-auto max-w-6xl">
      <div className="rounded-[24px] border border-black/10 bg-white px-6 py-6 shadow-sm animate-pulse">
        <div className="mb-5 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="h-6 w-36 rounded bg-slate-200" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-20 rounded-full bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-200" />
              </div>
              <div className="h-9 w-36 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
