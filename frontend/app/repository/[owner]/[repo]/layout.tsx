import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RepositoryHeader } from "@/components/layout/RepositoryHeader";
import { authOptions } from "@/lib/auth";
import {
  getCurrentMilestoneIssues,
  getMilestoneVelocityData,
} from "@/lib/github-client";
import {
  computeSprintProgress,
  type SprintProgress,
} from "@/lib/sprint-progress";

export default async function RepositoryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { owner: string; repo: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const selectedRepo = `${params.owner}/${params.repo}`;
  const repoNameOnly = params.repo;

  let currentSprintTitle: string | null = null;
  let currentIssueTitle: string | null = null;
  let sprintProgress: SprintProgress = { hasSprint: false };

  const [sprintResult, velocityResult] = await Promise.allSettled([
    getCurrentMilestoneIssues(
      params.owner,
      params.repo,
      session.accessToken,
      { state: "open", includeOverdue: true },
    ),
    getMilestoneVelocityData(
      params.owner,
      params.repo,
      session.accessToken,
      { includeOverdue: true },
    ),
  ]);

  if (sprintResult.status === "fulfilled") {
    currentSprintTitle = sprintResult.value.currentMilestone?.title ?? null;
    currentIssueTitle = sprintResult.value.issues[0]?.title ?? null;
  } else {
    console.error(
      "[repo layout] Failed to load current milestone:",
      sprintResult.reason,
    );
  }

  if (velocityResult.status === "fulfilled") {
    const { currentMilestone, openCount, closedCount } = velocityResult.value;
    sprintProgress = computeSprintProgress({
      openCount,
      closedCount,
      sprintStart: currentMilestone?.createdAt ?? null,
      sprintEnd: currentMilestone?.dueOn ?? null,
    });
  } else {
    console.error(
      "[repo layout] Failed to load velocity data:",
      velocityResult.reason,
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <Sidebar
        repositoryLabel={selectedRepo}
        overviewHref={`/repository/${params.owner}/${params.repo}/overview`}
        profileHref={`/repository/${params.owner}/${params.repo}/profile`}
        metricsHref={`/repository/${params.owner}/${params.repo}/metrics`}
        teamHref={`/repository/${params.owner}/${params.repo}/team`}
      />
      <div className="flex-1 overflow-y-auto bg-[#EFF0F2]">
        <RepositoryHeader
          repoName={repoNameOnly}
          sprintTitle={currentSprintTitle}
          issueTitle={currentIssueTitle}
          sprintProgress={sprintProgress}
        />
        <div className="px-6 py-8">{children}</div>
      </div>
    </div>
  );
}

