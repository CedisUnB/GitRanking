import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getWorkInProgressData,
  getUserOngoingTasks,
  type WorkInProgressData,
  type OngoingTaskDto,
} from "@/lib/github-client";
import { SprintGoalCard } from "@/components/overview/SprintGoalCard";
import { OngoingTasksCard } from "@/components/overview/OngoingTasksCard";

const EMPTY_WIP: WorkInProgressData = {
  todo: 0,
  doing: 0,
  review: 0,
  done: 0,
  sprintGoal: "",
};

export default async function RepositoryOverview({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const username = session.user?.username ?? "";

  const [wipResult, tasksResult] = await Promise.allSettled([
    getWorkInProgressData(params.owner, params.repo, session.accessToken),
    username
      ? getUserOngoingTasks(
          params.owner,
          params.repo,
          username,
          session.accessToken,
        )
      : Promise.resolve<OngoingTaskDto[]>([]),
  ]);

  const wipData =
    wipResult.status === "fulfilled" ? wipResult.value : EMPTY_WIP;

  if (wipResult.status === "rejected") {
    console.error("[overview] Failed to load WIP data:", wipResult.reason);
  }

  const tasks: OngoingTaskDto[] =
    tasksResult.status === "fulfilled" ? tasksResult.value : [];

  if (tasksResult.status === "rejected") {
    console.error(
      "[overview] Failed to load ongoing tasks:",
      tasksResult.reason,
    );
  }

  return (
    <main className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OngoingTasksCard tasks={tasks} />
        </div>
        <div className="space-y-6">
          <SprintGoalCard data={wipData} />
        </div>
      </div>
    </main>
  );
}
