"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SprintData } from "@/lib/github-client";

type Props = {
  sprints: SprintData[];
};

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

export function SprintTasksCard({ sprints }: Props) {
  const chartData = sprints.map((s) => ({
    name: s.milestone.title,
    "Completed Tasks": s.closedIssues,
    "Planned tasks": s.totalIssues,
  }));

  const last = sprints[sprints.length - 1];
  const prev = sprints[sprints.length - 2];
  const change =
    last && prev
      ? percentChange(last.closedIssues, prev.closedIssues)
      : null;

  return (
    <div className="rounded-2xl bg-[#F8F8F8] p-6 shadow-sm">
      <p className="text-base font-semibold text-slate-900">
        Sprint Tasks Completed
      </p>
      <p className="mt-0.5 text-sm text-slate-400">
        Completed tasks of the last 5 sprints
      </p>

      {change !== null && (
        <div className="mt-2 flex items-center gap-1 text-sm font-medium">
          <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
          </span>
          <span className="text-slate-400">vs last sprint</span>
        </div>
      )}

      {sprints.length === 0 ? (
        <div className="mt-8 flex items-center justify-center text-sm text-slate-400">
          No sprint data available
        </div>
      ) : (
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barCategoryGap="30%"
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  background: "#2D2B55",
                  border: "none",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar
                dataKey="Completed Tasks"
                fill="#7C3AED"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="Planned tasks"
                fill="#D1D5DB"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
