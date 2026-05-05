function ProfileCardSkeleton() {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white px-6 py-6 shadow-sm animate-pulse">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Avatar */}
        <div className="h-[120px] w-[120px] shrink-0 rounded-full bg-slate-200" />

        <div className="flex-1">
          {/* Name */}
          <div className="h-6 w-48 rounded bg-slate-200" />
          {/* Role */}
          <div className="mt-2 h-4 w-32 rounded bg-slate-200" />

          {/* Info rows */}
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-slate-200" />
              <div className="h-3.5 w-44 rounded bg-slate-200" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-slate-200" />
              <div className="h-3.5 w-36 rounded bg-slate-200" />
            </div>
          </div>

          {/* Bio */}
          <div className="mt-5 space-y-2">
            <div className="h-3 w-full max-w-lg rounded bg-slate-200" />
            <div className="h-3 w-3/4 max-w-md rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm animate-pulse"
        >
          <div className="h-3.5 w-28 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function AchievementsSkeleton() {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white px-6 py-6 shadow-sm animate-pulse">
      {/* Header */}
      <div className="mb-5 flex items-start gap-2">
        <div className="mt-0.5 h-6 w-6 rounded-full bg-slate-200" />
        <div>
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="mt-1.5 h-3.5 w-56 rounded bg-slate-200" />
        </div>
      </div>

      {/* Medal grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="mb-3 h-3 w-24 rounded bg-slate-200" />
            <div className="h-24 w-24 rounded-xl bg-slate-200" />
            <div className="mt-3 h-3 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <ProfileCardSkeleton />
      <StatsCardsSkeleton />
      <AchievementsSkeleton />
    </main>
  );
}
