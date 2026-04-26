"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WorkInProgressData } from "@/lib/github-client";

type Props = {
  data: WorkInProgressData;
};

const SLICES = [
  { key: "todo" as const, label: "TO-DO", color: "#D8B4FE" },
  { key: "doing" as const, label: "DOING", color: "#A855F7" },
  { key: "review" as const, label: "REVIEW", color: "#C4B5FD" },
  { key: "done" as const, label: "DONE", color: "#6D28D9" },
];

export function WorkInProgressCard({ data }: Props) {
  const total = data.todo + data.doing + data.review + data.done;

  const chartData = SLICES.map((s) => ({
    name: s.label,
    value: data[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  const renderLegend = () => (
    <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1">
      {SLICES.map((s) => {
        const count = data[s.key];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={s.key} className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs font-medium text-slate-600">
                {s.label}
              </span>
            </div>
            <span className="text-xs text-slate-500">{pct}%</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-2xl bg-[#F8F8F8] p-6 shadow-sm">
      <p className="text-base font-semibold text-slate-900">Work in progress</p>
      <p className="mt-0.5 text-sm text-slate-400">
        Status of the tasks in current sprint
      </p>

      {total === 0 ? (
        <div className="mt-8 flex items-center justify-center text-sm text-slate-400">
          No issues found in the current sprint
        </div>
      ) : (
        <>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    background: "#2D2B55",
                    border: "none",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value, name) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {renderLegend()}
        </>
      )}
    </div>
  );
}
