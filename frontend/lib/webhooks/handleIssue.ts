import { prisma } from "@/lib/prisma";
import {
  evaluateBadgesForUser,
  awardAllTasksBadgeToMilestoneParticipants,
} from "@/lib/badges";

export async function handleIssue(body: any) {
  const { action, issue, repository } = body;
  const githubRepoId = String(repository?.id);

  const repo = await prisma.repository.findUnique({ where: { githubRepoId } });
  if (!repo) return new Response("Issue processed", { status: 200 });

  if (action === "opened") {
    const creatorLogin: string = issue.user?.login;
    if (creatorLogin) {
      const user = await prisma.user.findFirst({ where: { username: creatorLogin } });
      if (user) {
        await prisma.userStats.upsert({
          where: { userId_repositoryId: { userId: user.id, repositoryId: repo.id } },
          update: { issuesCreated: { increment: 1 } },
          create: { userId: user.id, repositoryId: repo.id, issuesCreated: 1 },
        });
        await evaluateBadgesForUser(user.id, repo.id);
      }
    }
  }

  if (action === "closed") {
    const assignees: { login: string }[] = issue.assignees ?? [];
    const labels: { name: string }[] = issue.labels ?? [];
    const isBug = labels.some((l) => l.name.toLowerCase() === "bug");
    const milestoneId = issue.milestone ? String(issue.milestone.id) : null;

    for (const assignee of assignees) {
      const user = await prisma.user.findFirst({ where: { username: assignee.login } });
      if (!user) continue;

      await prisma.userStats.upsert({
        where: { userId_repositoryId: { userId: user.id, repositoryId: repo.id } },
        update: {
          issuesClosed: { increment: 1 },
          ...(isBug ? { bugsClosed: { increment: 1 } } : {}),
        },
        create: {
          userId: user.id,
          repositoryId: repo.id,
          issuesClosed: 1,
          bugsClosed: isBug ? 1 : 0,
        },
      });

      if (milestoneId) {
        await prisma.userSprintParticipation.upsert({
          where: {
            userId_repositoryId_milestoneId: {
              userId: user.id,
              repositoryId: repo.id,
              milestoneId,
            },
          },
          update: {},
          create: { userId: user.id, repositoryId: repo.id, milestoneId },
        });
      }

      await evaluateBadgesForUser(user.id, repo.id);
    }

    // When the last open issue in a milestone is closed, award all_tasks to participants
    if (milestoneId && issue.milestone?.open_issues === 0) {
      await awardAllTasksBadgeToMilestoneParticipants(repo.id, milestoneId);
    }
  }

  return new Response("Issue processed", { status: 200 });
}
