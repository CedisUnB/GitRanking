import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RepositoryHeader } from "@/components/layout/RepositoryHeader";
import { authOptions } from "@/lib/auth";
import { getCurrentMilestoneIssues } from "@/lib/github-client";

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
  try {
    const sprintData = await getCurrentMilestoneIssues(
      params.owner,
      params.repo,
      session.accessToken,
      { state: "open" }
    );
    currentSprintTitle = sprintData.currentMilestone?.title ?? null;
    currentIssueTitle = sprintData.issues[0]?.title ?? null;
  } catch (error) {
    console.error("[repo layout] Failed to load current milestone:", error);
  }

  return (
    <div className="flex h-screen overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <Sidebar
        repositoryLabel={selectedRepo}
        overviewHref={`/repository/${params.owner}/${params.repo}/overview`}
        profileHref={`/repository/${params.owner}/${params.repo}/profile`}
        metricsHref={`/repository/${params.owner}/${params.repo}/metrics`}
      />
      <div className="flex-1 overflow-y-auto bg-[#EFF0F2]">
        <RepositoryHeader
          repoName={repoNameOnly}
          sprintTitle={currentSprintTitle}
          issueTitle={currentIssueTitle}
        />
        <div className="px-6 py-8">{children}</div>
      </div>
    </div>
  );
}

