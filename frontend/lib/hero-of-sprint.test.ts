import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    votesForHeroOfSprint: {
      groupBy: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    repository: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  getPreviousSprintHero,
  hasVotedCurrentSprint,
  submitHeroVote,
  findRepositoryByOwnerAndName,
  resolveHeroOfSprintOverview,
} from "./hero-of-sprint";

function resetMocks() {
  for (const ns of Object.values(prismaMock)) {
    for (const fn of Object.values(ns)) {
      (fn as ReturnType<typeof vi.fn>).mockReset();
    }
  }
}

describe("getPreviousSprintHero", () => {
  beforeEach(resetMocks);

  it("returns null when there are no votes", async () => {
    prismaMock.votesForHeroOfSprint.groupBy.mockResolvedValue([]);
    const result = await getPreviousSprintHero("r1", "sprint-99", "Sprint 7");
    expect(result).toBeNull();
  });

  it("returns null when the winning count is zero", async () => {
    prismaMock.votesForHeroOfSprint.groupBy.mockResolvedValue([
      { nomineeId: "u1", _count: { id: 0 } },
    ]);
    const result = await getPreviousSprintHero("r1", "sprint-99", "Sprint 7");
    expect(result).toBeNull();
  });

  it("returns null when the nominee user record is missing", async () => {
    prismaMock.votesForHeroOfSprint.groupBy.mockResolvedValue([
      { nomineeId: "u1", _count: { id: 3 } },
    ]);
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await getPreviousSprintHero("r1", "sprint-99", "Sprint 7");
    expect(result).toBeNull();
  });

  it("uses display name when available", async () => {
    prismaMock.votesForHeroOfSprint.groupBy.mockResolvedValue([
      { nomineeId: "u1", _count: { id: 3 } },
    ]);
    prismaMock.user.findUnique.mockResolvedValue({
      name: "  Alice Smith  ",
      username: "alice",
    });
    const result = await getPreviousSprintHero("r1", "sprint-99", "Sprint 7");
    expect(result).toEqual({
      displayName: "Alice Smith",
      sprintTitle: "Sprint 7",
    });
  });

  it("falls back to username when name is empty", async () => {
    prismaMock.votesForHeroOfSprint.groupBy.mockResolvedValue([
      { nomineeId: "u1", _count: { id: 3 } },
    ]);
    prismaMock.user.findUnique.mockResolvedValue({
      name: "   ",
      username: "alice",
    });
    const result = await getPreviousSprintHero("r1", "sprint-99", "Sprint 7");
    expect(result?.displayName).toBe("alice");
  });
});

describe("hasVotedCurrentSprint", () => {
  beforeEach(resetMocks);

  it("returns true when a vote exists", async () => {
    prismaMock.votesForHeroOfSprint.findFirst.mockResolvedValue({ id: "v1" });
    expect(await hasVotedCurrentSprint("u1", "r1", "sprint-1")).toBe(true);
  });

  it("returns false when no vote exists", async () => {
    prismaMock.votesForHeroOfSprint.findFirst.mockResolvedValue(null);
    expect(await hasVotedCurrentSprint("u1", "r1", "sprint-1")).toBe(false);
  });
});

describe("submitHeroVote", () => {
  beforeEach(resetMocks);

  const baseInput = {
    repositoryId: "r1",
    voterGithubId: "gh-100",
    nominee: { githubId: 42, login: "alice", avatarUrl: "url" },
    currentSprintGithubId: "sprint-1",
  };

  it("throws VOTER_NOT_FOUND when the voter cannot be resolved", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(submitHeroVote(baseInput)).rejects.toThrow("VOTER_NOT_FOUND");
    expect(prismaMock.user.upsert).not.toHaveBeenCalled();
  });

  it("creates a new vote when none exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "voter-id" });
    prismaMock.user.upsert.mockResolvedValue({ id: "nominee-id" });
    prismaMock.votesForHeroOfSprint.findFirst.mockResolvedValue(null);

    await submitHeroVote(baseInput);

    expect(prismaMock.votesForHeroOfSprint.create).toHaveBeenCalledWith({
      data: {
        voterId: "voter-id",
        nomineeId: "nominee-id",
        sprintId: "sprint-1",
        repositoryId: "r1",
      },
    });
    expect(prismaMock.votesForHeroOfSprint.update).not.toHaveBeenCalled();
  });

  it("updates the existing vote when one is found", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "voter-id" });
    prismaMock.user.upsert.mockResolvedValue({ id: "nominee-id" });
    prismaMock.votesForHeroOfSprint.findFirst.mockResolvedValue({
      id: "existing-vote",
    });

    await submitHeroVote(baseInput);

    expect(prismaMock.votesForHeroOfSprint.update).toHaveBeenCalledWith({
      where: { id: "existing-vote" },
      data: { nomineeId: "nominee-id" },
    });
    expect(prismaMock.votesForHeroOfSprint.create).not.toHaveBeenCalled();
  });

  it("upserts the nominee with the supplied login + avatar", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "voter-id" });
    prismaMock.user.upsert.mockResolvedValue({ id: "nominee-id" });
    prismaMock.votesForHeroOfSprint.findFirst.mockResolvedValue(null);

    await submitHeroVote(baseInput);

    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { githubId: "42" },
      update: { username: "alice", avatarUrl: "url" },
      create: { githubId: "42", username: "alice", avatarUrl: "url" },
    });
  });
});

describe("findRepositoryByOwnerAndName", () => {
  beforeEach(resetMocks);

  it("delegates to prisma.repository.findFirst", async () => {
    prismaMock.repository.findFirst.mockResolvedValue({ id: "r1" });
    const result = await findRepositoryByOwnerAndName("acme", "repo");
    expect(prismaMock.repository.findFirst).toHaveBeenCalledWith({
      where: { owner: "acme", name: "repo" },
    });
    expect(result).toEqual({ id: "r1" });
  });
});

describe("resolveHeroOfSprintOverview", () => {
  beforeEach(resetMocks);

  const milestoneCtx = {
    current: { githubId: "current-1", title: "Sprint 7" },
    previous: { githubId: "prev-1", title: "Sprint 6" },
  };

  it("returns currentSprint with no hero/hasVoted when repo is null", async () => {
    const result = await resolveHeroOfSprintOverview(milestoneCtx, null, "gh-1");
    expect(result.previousHero).toBeNull();
    expect(result.hasVoted).toBe(false);
    expect(result.currentSprint).toEqual({
      title: "Sprint 7",
      githubId: "current-1",
    });
  });

  it("returns the previous hero when votes exist", async () => {
    prismaMock.votesForHeroOfSprint.groupBy.mockResolvedValue([
      { nomineeId: "u1", _count: { id: 4 } },
    ]);
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ name: "Alice", username: "alice" })
      .mockResolvedValueOnce({ id: "voter-id" });
    prismaMock.votesForHeroOfSprint.findFirst.mockResolvedValue({ id: "v1" });

    const result = await resolveHeroOfSprintOverview(
      milestoneCtx,
      { id: "r1" },
      "gh-1",
    );
    expect(result.previousHero).toEqual({
      displayName: "Alice",
      sprintTitle: "Sprint 6",
    });
    expect(result.hasVoted).toBe(true);
  });

  it("returns hasVoted=false when voter cannot be resolved", async () => {
    prismaMock.votesForHeroOfSprint.groupBy.mockResolvedValue([]);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await resolveHeroOfSprintOverview(
      milestoneCtx,
      { id: "r1" },
      "unknown-gh-id",
    );
    expect(result.hasVoted).toBe(false);
  });

  it("returns hasVoted=false when no voterGithubId is supplied", async () => {
    prismaMock.votesForHeroOfSprint.groupBy.mockResolvedValue([]);

    const result = await resolveHeroOfSprintOverview(
      milestoneCtx,
      { id: "r1" },
      null,
    );
    expect(result.hasVoted).toBe(false);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("handles a missing previous milestone", async () => {
    const ctx = { current: milestoneCtx.current, previous: null };
    prismaMock.user.findUnique.mockResolvedValue({ id: "voter-id" });
    prismaMock.votesForHeroOfSprint.findFirst.mockResolvedValue(null);

    const result = await resolveHeroOfSprintOverview(ctx, { id: "r1" }, "gh-1");
    expect(result.previousHero).toBeNull();
    expect(result.hasVoted).toBe(false);
  });

  it("handles a missing current milestone", async () => {
    const ctx = { current: null, previous: null };
    const result = await resolveHeroOfSprintOverview(ctx, { id: "r1" }, "gh-1");
    expect(result.currentSprint).toBeNull();
    expect(result.hasVoted).toBe(false);
  });
});
