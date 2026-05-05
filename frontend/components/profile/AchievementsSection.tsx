import Image from "next/image";

const BADGE_DISPLAY: Record<string, { label: string; condition: string }> = {
  task10: { label: "Checklist Initiate", condition: "10 Completed Tasks" },
  task20: { label: "Delivery Machine", condition: "20 Completed Tasks" },
  task40: { label: "Code Warrior", condition: "40+ Completed Tasks" },
  backlog: { label: "Backlog Visionary", condition: "+20 Created Tasks" },
  bug: { label: "Pest Annihilator", condition: "20 Bug Tasks Done" },
  sprint1: { label: "Wheels on the ground", condition: "1 Sprint Participated" },
  sprint5: { label: "Route specialist", condition: "5 Sprints Participated" },
  sprint10: { label: "Spint Oracle", condition: "10 Sprints Participated" }, 
  all_tasks: { label: "Team Finisher", condition: "All Sprint Tasks Done" },
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon_url: string;
};

type Props = {
  allBadges: Badge[];
  earnedBadgeIds: Set<string>;
};

export function AchievementsSection({ allBadges, earnedBadgeIds }: Props) {
  if (allBadges.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-black/10 bg-white px-6 py-6 shadow-sm">
      <div className="mb-5 flex items-start gap-2">
        <span className="mt-0.5 text-xl" aria-hidden="true">
          🚀
        </span>
        <div>
          <h2 className="text-[18px] font-semibold leading-6 text-slate-900">
            Achievements
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Your achievements and milestones reached
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {allBadges.map((badge) => {
          const earned = earnedBadgeIds.has(badge.id);
          const display = BADGE_DISPLAY[badge.name] ?? {
            label: badge.name,
            condition: badge.description,
          };

          return (
            <div
              key={badge.id}
              className={`group relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all ${
                earned
                  ? "border-[#6B1FA6]/20 bg-white shadow-sm"
                  : "border-slate-100 bg-slate-50 opacity-40 grayscale"
              }`}
            >
              {/* Hover tooltip overlay */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-900/85 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <p className="text-[13px] font-bold uppercase tracking-wide text-white">
                  {display.label}
                </p>
                <p className="mt-2 text-[12px] leading-snug text-slate-300">
                  {badge.description}
                </p>
              </div>
              <Image
                src={badge.icon_url}
                alt={display.label}
                width={120}
                height={130}
                className="object-contain"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
