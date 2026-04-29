import { CheckCircle2, Settings2, Circle, Box } from "lucide-react";
import type { OngoingTaskDto, OngoingTaskStatus } from "@/lib/github-client";

const STATUS_BADGE: Record<
  OngoingTaskStatus,
  {
    label: string;
    icon: typeof Settings2;
    badgeClass: string;
    borderClass: string;
  }
> = {
  doing: {
    label: "DOING",
    icon: Settings2,
    badgeClass: "bg-indigo-200 text-indigo-700",
    borderClass: "border-l-indigo-500",
  },
  review: {
    label: "REVIEW",
    icon: Circle,
    badgeClass: "bg-yellow-200 text-yellow-800",
    borderClass: "border-l-yellow-500",
  },
  todo: {
    label: "TO DO",
    icon: Box,
    badgeClass: "bg-gray-200 text-gray-700",
    borderClass: "border-l-gray-400",
  },
};

type Props = {
  tasks: OngoingTaskDto[];
};

export function OngoingTasksCard({ tasks }: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-6 w-6 text-purple-700" strokeWidth={2} />
        <h2 className="text-xl font-semibold text-slate-900">
          Your ongoing tasks ({tasks.length})
        </h2>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        {tasks.length === 1 ? "1 task ativa" : `${tasks.length} tasks ativas`}
      </p>

      {tasks.length === 0 ? (
        <p className="mt-6 text-sm italic text-slate-400">
          You have no ongoing tasks in this sprint.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => {
            const config = STATUS_BADGE[task.status];
            return (
              <li key={task.id}>
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-lg border-l-4 ${config.borderClass} bg-violet-50/40 px-4 py-3 transition hover:bg-violet-50`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {task.title}
                    </span>
                  </div>
                  {task.points !== null && (
                    <p className="mt-1 text-xs text-slate-500">
                      {task.points} pts
                    </p>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
