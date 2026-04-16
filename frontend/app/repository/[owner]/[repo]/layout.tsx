import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RepositoryHeader } from "@/components/layout/RepositoryHeader";
import { authOptions } from "@/lib/auth";

type GitHubIssue = {
  title: string;
  pull_request?: unknown;
};

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
  try {
    const res = await fetch(
      `https://api.github.com/repos/${params.owner}/${params.repo}/issues?state=open&per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const issues = (await res.json()) as GitHubIssue[];
      const firstIssue = issues.find((i) => !("pull_request" in i));
      currentSprintTitle = firstIssue?.title ?? null;
    }
  } catch (error) {
    console.error("[repo layout] Failed to load issues:", error);
  }

  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Sidebar
        repositoryLabel={selectedRepo}
        overviewHref={`/repository/${params.owner}/${params.repo}/overview`}
        profileHref={`/repository/${params.owner}/${params.repo}/profile`}
      />
      <div className="flex-1 bg-[#EFF0F2]">
        <RepositoryHeader repoName={repoNameOnly} sprintTitle={currentSprintTitle} />
        <div className="px-6 py-8">{children}</div>
      </div>
    </div>
  );
}

