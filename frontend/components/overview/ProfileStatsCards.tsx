import type { UserContributionStats } from "@/lib/github-client";

type Props = {
  stats: UserContributionStats;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function ProfileStatsCards({ stats }: Props) {
  const cards: Array<{ label: string; value: number }> = [
    { label: "Tasks done", value: stats.tasksDone },
    { label: "Accumulated Points", value: stats.accumulatedPoints },
    { label: "Sprints done", value: stats.sprintsDone },
    { label: "Commits done", value: stats.commitsDone },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-2 text-[28px] font-semibold leading-none text-slate-900">
            {numberFormatter.format(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
