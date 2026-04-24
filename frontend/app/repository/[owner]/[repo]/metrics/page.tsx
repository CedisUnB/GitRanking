import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getMilestoneVelocityData } from "@/lib/github-client";
import { OracleCard, type OracleStatus } from "@/components/metrics/OracleCard";

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

  try {
    const data = await getMilestoneVelocityData(
      params.owner,
      params.repo,
      session.accessToken,
    );

    if (data.currentMilestone) {
      pageTitle = `Metrics — ${data.currentMilestone.title}`;

      if (!data.currentMilestone.dueOn) {
        oracleStatus = "no_sprint";
      } else {
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
  } catch (err) {
    console.error("[metrics] Failed to load milestone data:", err);
  }

  return (
    <main className="mx-auto max-w-6xl">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold text-slate-900">{pageTitle}</h1>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <OracleCard status={oracleStatus} daysAhead={daysAhead} />
        </div>
      </div>
    </main>
  );
}
