import { prisma } from "@/lib/prisma";

const BADGE_NAMES = {
  TASK_10: "task10",
  TASK_20: "task20",
  TASK_40: "task40",
  BACKLOG: "backlog",
  BUG: "bug",
  SPRINT_1: "sprint1",
  SPRINT_5: "sprint5",
  SPRINT_10: "sprint10",
  ALL_TASKS: "all_tasks",
} as const;

async function awardBadge(userId: string, repositoryId: string, badgeName: string) {
  const badge = await prisma.badges.findUnique({ where: { name: badgeName } });
  if (!badge) return;

  try {
    await prisma.userBadges.create({
      data: { userId, badgeId: badge.id, repositoryId },
    });
  } catch {
    // Unique constraint — badge already awarded, skip silently
  }
}

export async function evaluateBadgesForUser(userId: string, repositoryId: string) {
  const stats = await prisma.userStats.findUnique({
    where: { userId_repositoryId: { userId, repositoryId } },
  });

  const sprintCount = await prisma.userSprintParticipation.count({
    where: { userId, repositoryId },
  });

  if (stats) {
    if (stats.issuesClosed >= 10) await awardBadge(userId, repositoryId, BADGE_NAMES.TASK_10);
    if (stats.issuesClosed >= 20) await awardBadge(userId, repositoryId, BADGE_NAMES.TASK_20);
    if (stats.issuesClosed >= 40) await awardBadge(userId, repositoryId, BADGE_NAMES.TASK_40);
    if (stats.issuesCreated >= 20) await awardBadge(userId, repositoryId, BADGE_NAMES.BACKLOG);
    if (stats.bugsClosed >= 20) await awardBadge(userId, repositoryId, BADGE_NAMES.BUG);
  }

  if (sprintCount >= 1) await awardBadge(userId, repositoryId, BADGE_NAMES.SPRINT_1);
  if (sprintCount >= 5) await awardBadge(userId, repositoryId, BADGE_NAMES.SPRINT_5);
  if (sprintCount >= 10) await awardBadge(userId, repositoryId, BADGE_NAMES.SPRINT_10);
}

export async function awardAllTasksBadgeToMilestoneParticipants(
  repositoryId: string,
  milestoneId: string,
) {
  const participants = await prisma.userSprintParticipation.findMany({
    where: { repositoryId, milestoneId },
    select: { userId: true },
  });

  for (const { userId } of participants) {
    await awardBadge(userId, repositoryId, BADGE_NAMES.ALL_TASKS);
  }
}

export async function getUserBadgesForRepo(
  username: string,
  owner: string,
  repoName: string,
) {
  const user = await prisma.user.findFirst({ where: { username } });
  if (!user) return { allBadges: [], earnedBadgeIds: new Set<string>() };

  const repository = await prisma.repository.findFirst({
    where: { owner, name: repoName },
  });

  const allBadges = await prisma.badges.findMany({ orderBy: { name: "asc" } });

  if (!repository) return { allBadges, earnedBadgeIds: new Set<string>() };

  const earned = await prisma.userBadges.findMany({
    where: { userId: user.id, repositoryId: repository.id },
    select: { badgeId: true },
  });

  return { allBadges, earnedBadgeIds: new Set(earned.map((e) => e.badgeId)) };
}
