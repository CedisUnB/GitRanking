import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getHeroSprintMilestoneContext,
  getWorkInProgressData,
  getUserOngoingTasks,
  type WorkInProgressData,
  type OngoingTaskDto,
} from "@/lib/github-client";
import {
  findRepositoryByOwnerAndName,
  resolveHeroOfSprintOverview,
} from "@/lib/hero-of-sprint";
import { upsertRepository } from "@/lib/repository";
import { SprintGoalCard } from "@/components/overview/SprintGoalCard";
import { HeroOfSprintCard } from "@/components/overview/HeroOfSprintCard";
import { OngoingTasksCard } from "@/components/overview/OngoingTasksCard";
import type { HeroOfSprintOverviewResponse } from "@/types/github";

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

  await upsertRepository(params.owner, params.repo, session.accessToken);

  const [wipTasksResults, milestoneCtx, repoRow] = await Promise.all([
    Promise.allSettled([
      getWorkInProgressData(params.owner, params.repo, session.accessToken),
      username
        ? getUserOngoingTasks(
            params.owner,
            params.repo,
            username,
            session.accessToken,
          )
        : Promise.resolve<OngoingTaskDto[]>([]),
    ]),
    getHeroSprintMilestoneContext(
      params.owner,
      params.repo,
      session.accessToken,
    ).catch((err) => {
      console.error("[overview] Failed to load sprint milestones:", err);
      return null;
    }),
    findRepositoryByOwnerAndName(params.owner, params.repo),
  ]);

  const [wipResult, tasksResult] = wipTasksResults;

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

  const emptyHero: HeroOfSprintOverviewResponse = {
    previousHero: null,
    currentSprint: null,
    hasVoted: false,
  };

  const heroInitial: HeroOfSprintOverviewResponse = milestoneCtx
    ? await resolveHeroOfSprintOverview(
        milestoneCtx,
        repoRow,
        session.user?.githubId ?? null,
      )
    : emptyHero;

  return (
    <main className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OngoingTasksCard tasks={tasks} />
        </div>
        <div className="space-y-6">
          <SprintGoalCard data={wipData} />
          <HeroOfSprintCard
            owner={params.owner}
            repo={params.repo}
            initialData={heroInitial}
          />
        </div>
      </div>
    </main>
  );
}
