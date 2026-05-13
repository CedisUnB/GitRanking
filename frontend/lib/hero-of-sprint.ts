import type { HeroSprintMilestoneContext } from "@/lib/github-client";
import { prisma } from "@/lib/prisma";
import type { HeroOfSprintOverviewResponse } from "@/types/github";

export type PreviousSprintHero = {
  displayName: string;
  sprintTitle: string;
};

/**
 * Winner = nominee with most votes for the given GitHub milestone id on this repository.
 */
export async function getPreviousSprintHero(
  repositoryId: string,
  previousSprintGithubId: string,
  sprintTitle: string,
): Promise<PreviousSprintHero | null> {
  const tallies = await prisma.votesForHeroOfSprint.groupBy({
    by: ["nomineeId"],
    where: {
      repositoryId,
      sprintId: previousSprintGithubId,
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 1,
  });

  const top = tallies[0];
  if (!top || top._count.id === 0) return null;

  const nominee = await prisma.user.findUnique({
    where: { id: top.nomineeId },
    select: { name: true, username: true },
  });
  if (!nominee) return null;

  return {
    displayName: nominee.name?.trim() || nominee.username,
    sprintTitle,
  };
}

export async function hasVotedCurrentSprint(
  voterId: string,
  repositoryId: string,
  currentSprintGithubId: string,
): Promise<boolean> {
  const row = await prisma.votesForHeroOfSprint.findFirst({
    where: {
      voterId,
      repositoryId,
      sprintId: currentSprintGithubId,
    },
    select: { id: true },
  });
  return row !== null;
}

export type HeroVoteNomineeInput = {
  githubId: number;
  login: string;
  avatarUrl: string;
};

/**
 * One vote per voter per sprint per repository: existing row gets nomineeId replaced.
 */
export async function submitHeroVote(input: {
  repositoryId: string;
  voterGithubId: string;
  nominee: HeroVoteNomineeInput;
  currentSprintGithubId: string;
}): Promise<void> {
  const voter = await prisma.user.findUnique({
    where: { githubId: input.voterGithubId },
  });
  if (!voter) {
    throw new Error("VOTER_NOT_FOUND");
  }

  const nomineeUser = await prisma.user.upsert({
    where: { githubId: String(input.nominee.githubId) },
    update: {
      username: input.nominee.login,
      avatarUrl: input.nominee.avatarUrl,
    },
    create: {
      githubId: String(input.nominee.githubId),
      username: input.nominee.login,
      avatarUrl: input.nominee.avatarUrl,
    },
  });

  const existing = await prisma.votesForHeroOfSprint.findFirst({
    where: {
      voterId: voter.id,
      repositoryId: input.repositoryId,
      sprintId: input.currentSprintGithubId,
    },
  });

  if (existing) {
    await prisma.votesForHeroOfSprint.update({
      where: { id: existing.id },
      data: { nomineeId: nomineeUser.id },
    });
    return;
  }

  await prisma.votesForHeroOfSprint.create({
    data: {
      voterId: voter.id,
      nomineeId: nomineeUser.id,
      sprintId: input.currentSprintGithubId,
      repositoryId: input.repositoryId,
    },
  });
}

export async function findRepositoryByOwnerAndName(
  owner: string,
  name: string,
) {
  return prisma.repository.findFirst({
    where: { owner, name },
  });
}

export async function resolveHeroOfSprintOverview(
  milestoneCtx: HeroSprintMilestoneContext,
  repoRow: { id: string } | null,
  voterGithubId: string | null,
): Promise<HeroOfSprintOverviewResponse> {
  const currentSprint = milestoneCtx.current
    ? {
        title: milestoneCtx.current.title,
        githubId: milestoneCtx.current.githubId,
      }
    : null;

  if (!repoRow) {
    return {
      previousHero: null,
      currentSprint,
      hasVoted: false,
    };
  }

  const previousHero =
    milestoneCtx.previous &&
    (await getPreviousSprintHero(
      repoRow.id,
      milestoneCtx.previous.githubId,
      milestoneCtx.previous.title,
    ));

  let hasVoted = false;
  if (milestoneCtx.current && voterGithubId) {
    const voter = await prisma.user.findUnique({
      where: { githubId: voterGithubId },
      select: { id: true },
    });
    if (voter) {
      hasVoted = await hasVotedCurrentSprint(
        voter.id,
        repoRow.id,
        milestoneCtx.current.githubId,
      );
    }
  }

  return {
    previousHero,
    currentSprint,
    hasVoted,
  };
}
