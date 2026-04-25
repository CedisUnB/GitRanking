import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getMilestoneVelocityData,
  getWorkInProgressData,
  getSprintHistoryData,
} from "@/lib/github-client";
import { OracleCard, type OracleStatus } from "@/components/metrics/OracleCard";
import { WorkInProgressCard } from "@/components/metrics/WorkInProgressCard";
import { StoryPointsCard } from "@/components/metrics/StoryPointsCard";
import { SprintTasksCard } from "@/components/metrics/SprintTasksCard";

function computeOracleStatus(
  openCount: number,
  closedCount: number,
  sprintStart: string,
  sprintEnd: string,
): { status: OracleStatus; daysAhead?: number } {
  if (closedCount === 0) return { status: "no_data" };

  const now = Date.now();
  const startMs = new Date(sprintStart).getTime();
  const endMs = new Date(sprintEnd).getTime();

  const daysElapsed = Math.max(1, (now - startMs) / 86_400_000);
  const daysRemaining = (endMs - now) / 86_400_000;

  const dailyVelocity = closedCount / daysElapsed;
  const daysNeeded = openCount / dailyVelocity;
  const daysAhead = daysRemaining - daysNeeded;

  if (daysAhead > 0.5) {
    return { status: "early", daysAhead: Math.round(daysAhead) };
  }
  if (daysAhead > -0.5) {
    return { status: "on_track" };
  }
  return { status: "at_risk", daysAhead: Math.round(daysAhead) };
}

export default async function MetricsPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let oracleStatus: OracleStatus = "no_sprint";
  let daysAhead: number | undefined;
  let pageTitle = "Metrics";

  const [velocityData, wipData, sprintHistory] = await Promise.allSettled([
    getMilestoneVelocityData(params.owner, params.repo, session.accessToken),
    getWorkInProgressData(params.owner, params.repo, session.accessToken),
    getSprintHistoryData(params.owner, params.repo, session.accessToken),
  ]);

  // Oracle
  if (velocityData.status === "fulfilled") {
    const data = velocityData.value;
    if (data.currentMilestone) {
      pageTitle = `Metrics — ${data.currentMilestone.title}`;

      if (data.currentMilestone.dueOn) {
        const result = computeOracleStatus(
          data.openCount,
          data.closedCount,
          data.currentMilestone.createdAt,
          data.currentMilestone.dueOn,
        );
        oracleStatus = result.status;
        daysAhead = result.daysAhead;
      }
    }
  } else {
    console.error("[metrics] Failed to load velocity data:", velocityData.reason);
  }

  const wip =
    wipData.status === "fulfilled"
      ? wipData.value
      : { todo: 0, doing: 0, review: 0, done: 0 };

  const sprints =
    sprintHistory.status === "fulfilled" ? sprintHistory.value : [];

  if (wipData.status === "rejected") {
    console.error("[metrics] Failed to load WIP data:", wipData.reason);
  }
  if (sprintHistory.status === "rejected") {
    console.error("[metrics] Failed to load sprint history:", sprintHistory.reason);
  }

  return (
    <main className="mx-auto max-w-6xl">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold text-slate-900">{pageTitle}</h1>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <OracleCard status={oracleStatus} daysAhead={daysAhead} />
          <WorkInProgressCard data={wip} />
          <StoryPointsCard sprints={sprints} />
          <SprintTasksCard sprints={sprints} />
        </div>
      </div>
    </main>
  );
}
