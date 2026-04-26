import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getWorkInProgressData } from "@/lib/github-client";
import { SprintGoalCard } from "@/components/overview/SprintGoalCard";

export default async function RepositoryOverview({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const wipData = await getWorkInProgressData(
    params.owner,
    params.repo,
    session.accessToken,
  ).catch(() => ({
    todo: 0,
    doing: 0,
    review: 0,
    done: 0,
    sprintGoal: "",
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <SprintGoalCard data={wipData} />
    </main>
  );
}
