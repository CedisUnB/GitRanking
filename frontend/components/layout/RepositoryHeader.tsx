export function RepositoryHeader({
  repoName,
  sprintTitle,
}: {
  repoName: string;
  sprintTitle?: string | null;
}) {
  const sprintText =
    sprintTitle && sprintTitle.trim().length > 0
      ? sprintTitle
      : "No sprints created yet.";

  // Placeholder visual (sem logica ainda)
  const progressPercent = 65;

  return (
    <header className="border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">Repository Name</p>
          <p className="truncate text-sm font-semibold text-slate-900">
            {repoName}
          </p>

          <div className="mt-1 flex min-w-0 items-start gap-4">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
              {sprintText}
            </p>

            <div className="shrink-0">
              <div className="h-[9px] w-[211.73px] overflow-hidden rounded-full bg-[#D9D9D9]">
                <div
                  className="h-[9px]"
                  style={{
                    width: `${progressPercent}%`,
                    background:
                      "linear-gradient(90deg, #8200DB 0%, rgba(130, 0, 219, 0.59) 100%)",
                    borderRadius: "10px 0px 0px 10px",
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-600">
                {progressPercent}% - Day 7/10 | Ends in 3 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

