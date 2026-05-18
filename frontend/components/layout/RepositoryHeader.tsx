import type { SprintProgress } from "@/lib/sprint-progress";

export function RepositoryHeader({
  repoName,
  sprintTitle,
  issueTitle,
  sprintProgress,
}: {
  repoName: string;
  sprintTitle?: string | null;
  issueTitle?: string | null;
  sprintProgress?: SprintProgress;
}) {
  const sprintText =
    sprintTitle && sprintTitle.trim().length > 0
      ? sprintTitle
      : "No sprints created yet";

  const hasSprint = sprintProgress?.hasSprint === true;
  const barPercent = hasSprint ? sprintProgress.percent : 100;

  let progressLabel: string;
  if (!hasSprint) {
    progressLabel = "No active sprint";
  } else {
    const { percent, daysElapsed, daysTotal, daysRemaining, isOverdue } =
      sprintProgress;
    const remainingAbs = Math.abs(daysRemaining);
    const tail = isOverdue
      ? `Past due by ${remainingAbs} day${remainingAbs === 1 ? "" : "s"}`
      : `Ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
    progressLabel = `${percent}% - Day ${daysElapsed}/${daysTotal} | ${tail}`;
  }

  const labelColorClass =
    hasSprint && sprintProgress.isOverdue ? "text-red-600" : "text-slate-600";

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
              {`${sprintText}`}
            </p>

            <div className="shrink-0">
              <div className="h-[9px] w-[211.73px] overflow-hidden rounded-full bg-[#D9D9D9]">
                <div
                  className="h-[9px]"
                  style={{
                    width: `${barPercent}%`,
                    background:
                      "linear-gradient(90deg, #8200DB 0%, rgba(130, 0, 219, 0.59) 100%)",
                    borderRadius: "10px 0px 0px 10px",
                  }}
                />
              </div>
              <p className={`mt-2 text-xs font-medium ${labelColorClass}`}>
                {progressLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
