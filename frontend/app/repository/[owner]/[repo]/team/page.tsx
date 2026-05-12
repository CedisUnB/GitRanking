import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getRepositoryMembers, GithubApiError } from "@/lib/github-client";
import { TeamMembersSection } from "@/components/team/TeamMembersSection";
import type { RepositoryMemberDto } from "@/types/github";

export default async function TeamPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { owner, repo } = params;

  let members: RepositoryMemberDto[] = [];

  try {
    members = await getRepositoryMembers(owner, repo, session.accessToken);
  } catch (error) {
    if (error instanceof GithubApiError) {
      console.error("[team] Failed to fetch members:", error.message);
    } else {
      console.error("[team] Failed to fetch members:", error);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <TeamMembersSection
        members={members}
        currentUsername={session.user.username ?? ""}
        owner={owner}
        repo={repo}
      />
    </main>
  );
}
