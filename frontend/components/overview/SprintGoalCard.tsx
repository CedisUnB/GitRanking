"use client";

import { Target, CheckCircle, Settings2, Circle, Box } from "lucide-react";
import type { WorkInProgressData } from "@/lib/github-client";

type Props = {
  data: WorkInProgressData;
};

const STATUS_CONFIG = [
  {
    key: "done" as const,
    label: "DONE",
    icon: CheckCircle,
    containerClass: "bg-green-50 border border-green-200",
    iconClass: "text-green-500",
    labelClass: "text-green-600",
    countClass: "text-green-600",
  },
  {
    key: "doing" as const,
    label: "DOING",
    icon: Settings2,
    containerClass: "bg-indigo-100 border border-indigo-200",
    iconClass: "text-indigo-500",
    labelClass: "text-indigo-700",
    countClass: "text-slate-800",
  },
  {
    key: "review" as const,
    label: "REVIEW",
    icon: Circle,
    containerClass: "bg-purple-50 border border-purple-200",
    iconClass: "text-purple-400",
    labelClass: "text-purple-600",
    countClass: "text-purple-600",
  },
  {
    key: "todo" as const,
    label: "TODO",
    icon: Box,
    containerClass: "bg-gray-100 border border-gray-200",
    iconClass: "text-gray-400",
    labelClass: "text-gray-500",
    countClass: "text-slate-800",
  },
];

export function SprintGoalCard({ data }: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-purple-700" strokeWidth={2} />
        <h2 className="text-xl font-semibold text-slate-900">SprintGoal</h2>
      </div>

      {/* Sprint goal text */}
      {data.sprintGoal ? (
        <p className="mt-2 text-sm text-slate-500 italic">
          &ldquo;{data.sprintGoal}&rdquo;
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-400 italic">
          No active sprint found
        </p>
      )}

      {/* Status grid */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {STATUS_CONFIG.map(({ key, label, icon: Icon, containerClass, iconClass, labelClass, countClass }) => (
          <div
            key={key}
            className={`rounded-xl p-4 ${containerClass}`}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={`h-4 w-4 ${iconClass}`} strokeWidth={1.5} />
              <span className={`text-xs font-semibold tracking-wide ${labelClass}`}>
                {label}
              </span>
            </div>
            <p className={`mt-2 text-3xl font-semibold ${countClass}`}>
              {data[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
