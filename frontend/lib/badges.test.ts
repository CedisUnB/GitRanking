import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    badges: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    userBadges: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    userStats: {
      findUnique: vi.fn(),
    },
    userSprintParticipation: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    recognitionMessage: {
      count: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    repository: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  evaluateBadgesForUser,
  awardAllTasksBadgeToMilestoneParticipants,
  awardRecognitionBadge,
  getUserBadgesForRepo,
} from "./badges";

const USER_ID = "user-1";
const REPO_ID = "repo-1";

function resetMocks() {
  for (const ns of Object.values(prismaMock)) {
    for (const fn of Object.values(ns)) {
      (fn as ReturnType<typeof vi.fn>).mockReset();
    }
  }
  prismaMock.badges.findUnique.mockImplementation(async ({ where }: any) => ({
    id: `badge-${where.name}`,
    name: where.name,
  }));
}

describe("evaluateBadgesForUser", () => {
  beforeEach(resetMocks);

  it("does nothing when user has no stats and no sprint participation", async () => {
    prismaMock.userStats.findUnique.mockResolvedValue(null);
    prismaMock.userSprintParticipation.count.mockResolvedValue(0);

    await evaluateBadgesForUser(USER_ID, REPO_ID);
    expect(prismaMock.userBadges.create).not.toHaveBeenCalled();
  });

  it("awards task10/task20/task40 once each threshold is met", async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      issuesClosed: 40,
      issuesCreated: 0,
      bugsClosed: 0,
    });
    prismaMock.userSprintParticipation.count.mockResolvedValue(0);

    await evaluateBadgesForUser(USER_ID, REPO_ID);

    const awardedNames = prismaMock.userBadges.create.mock.calls.map(
      (c: any[]) => c[0].data.badgeId,
    );
    expect(awardedNames).toContain("badge-task10");
    expect(awardedNames).toContain("badge-task20");
    expect(awardedNames).toContain("badge-task40");
  });

  it("awards backlog when issuesCreated >= 20", async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      issuesClosed: 0,
      issuesCreated: 20,
      bugsClosed: 0,
    });
    prismaMock.userSprintParticipation.count.mockResolvedValue(0);

    await evaluateBadgesForUser(USER_ID, REPO_ID);

    expect(prismaMock.userBadges.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, badgeId: "badge-backlog", repositoryId: REPO_ID },
    });
  });

  it("awards bug badge when bugsClosed >= 20", async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      issuesClosed: 0,
      issuesCreated: 0,
      bugsClosed: 25,
    });
    prismaMock.userSprintParticipation.count.mockResolvedValue(0);

    await evaluateBadgesForUser(USER_ID, REPO_ID);

    const awardedNames = prismaMock.userBadges.create.mock.calls.map(
      (c: any[]) => c[0].data.badgeId,
    );
    expect(awardedNames).toContain("badge-bug");
  });

  it("awards sprint1/sprint5/sprint10 based on participation count", async () => {
    prismaMock.userStats.findUnique.mockResolvedValue(null);
    prismaMock.userSprintParticipation.count.mockResolvedValue(10);

    await evaluateBadgesForUser(USER_ID, REPO_ID);

    const awardedNames = prismaMock.userBadges.create.mock.calls.map(
      (c: any[]) => c[0].data.badgeId,
    );
    expect(awardedNames).toEqual(
      expect.arrayContaining(["badge-sprint1", "badge-sprint5", "badge-sprint10"]),
    );
  });

  it("does not award sprint5/10 with only 1 participation", async () => {
    prismaMock.userStats.findUnique.mockResolvedValue(null);
    prismaMock.userSprintParticipation.count.mockResolvedValue(1);

    await evaluateBadgesForUser(USER_ID, REPO_ID);

    const awardedNames = prismaMock.userBadges.create.mock.calls.map(
      (c: any[]) => c[0].data.badgeId,
    );
    expect(awardedNames).toEqual(["badge-sprint1"]);
  });

  it("silently swallows unique-constraint errors", async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      issuesClosed: 10,
      issuesCreated: 0,
      bugsClosed: 0,
    });
    prismaMock.userSprintParticipation.count.mockResolvedValue(0);
    prismaMock.userBadges.create.mockRejectedValueOnce(
      new Error("UNIQUE constraint"),
    );

    await expect(evaluateBadgesForUser(USER_ID, REPO_ID)).resolves.toBeUndefined();
  });

  it("does not award a badge when the badge definition is missing", async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      issuesClosed: 10,
      issuesCreated: 0,
      bugsClosed: 0,
    });
    prismaMock.userSprintParticipation.count.mockResolvedValue(0);
    prismaMock.badges.findUnique.mockResolvedValueOnce(null);

    await evaluateBadgesForUser(USER_ID, REPO_ID);
    expect(prismaMock.userBadges.create).not.toHaveBeenCalled();
  });
});

describe("awardAllTasksBadgeToMilestoneParticipants", () => {
  beforeEach(resetMocks);

  it("awards the all_tasks badge to every milestone participant", async () => {
    prismaMock.userSprintParticipation.findMany.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
      { userId: "u3" },
    ]);

    await awardAllTasksBadgeToMilestoneParticipants(REPO_ID, "ms-99");

    expect(prismaMock.userBadges.create).toHaveBeenCalledTimes(3);
    const ids = prismaMock.userBadges.create.mock.calls.map(
      (c: any[]) => c[0].data.userId,
    );
    expect(ids).toEqual(["u1", "u2", "u3"]);
  });

  it("does nothing when there are no participants", async () => {
    prismaMock.userSprintParticipation.findMany.mockResolvedValue([]);
    await awardAllTasksBadgeToMilestoneParticipants(REPO_ID, "ms-99");
    expect(prismaMock.userBadges.create).not.toHaveBeenCalled();
  });
});

describe("awardRecognitionBadge", () => {
  beforeEach(resetMocks);

  it("ignores unknown reasons", async () => {
    await awardRecognitionBadge("u1", REPO_ID, "spaghetti");
    expect(prismaMock.recognitionMessage.count).not.toHaveBeenCalled();
    expect(prismaMock.userBadges.create).not.toHaveBeenCalled();
  });

  it("awards innovation badge only the first time count === 1", async () => {
    prismaMock.recognitionMessage.count.mockResolvedValue(1);
    await awardRecognitionBadge("u1", REPO_ID, "innovation");
    expect(prismaMock.userBadges.create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        badgeId: "badge-recognition_innovation",
        repositoryId: REPO_ID,
      },
    });
  });

  it("does not award when there are already multiple recognitions", async () => {
    prismaMock.recognitionMessage.count.mockResolvedValue(5);
    await awardRecognitionBadge("u1", REPO_ID, "leadership");
    expect(prismaMock.userBadges.create).not.toHaveBeenCalled();
  });

  it("normalises reason casing", async () => {
    prismaMock.recognitionMessage.count.mockResolvedValue(1);
    await awardRecognitionBadge("u1", REPO_ID, "TeamWork");
    const call = prismaMock.recognitionMessage.count.mock.calls[0][0];
    expect(call.where.reason).toBe("teamwork");
  });
});

describe("getUserBadgesForRepo", () => {
  beforeEach(resetMocks);

  it("returns empty when the user is not found", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    const result = await getUserBadgesForRepo("ghost", "acme", "repo");
    expect(result.allBadges).toEqual([]);
    expect(result.earnedBadgeIds.size).toBe(0);
    expect(prismaMock.badges.findMany).not.toHaveBeenCalled();
  });

  it("returns allBadges and empty earned set when repo does not exist", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "u1" });
    prismaMock.repository.findFirst.mockResolvedValue(null);
    prismaMock.badges.findMany.mockResolvedValue([{ id: "b1", name: "task10" }]);

    const result = await getUserBadgesForRepo("alice", "acme", "repo");
    expect(result.allBadges).toHaveLength(1);
    expect(result.earnedBadgeIds.size).toBe(0);
  });

  it("returns the earned badge ids when both user and repo exist", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "u1" });
    prismaMock.repository.findFirst.mockResolvedValue({ id: "r1" });
    prismaMock.badges.findMany.mockResolvedValue([
      { id: "b1", name: "task10" },
      { id: "b2", name: "task20" },
    ]);
    prismaMock.userBadges.findMany.mockResolvedValue([
      { badgeId: "b1" },
      { badgeId: "b2" },
    ]);

    const result = await getUserBadgesForRepo("alice", "acme", "repo");
    expect(result.allBadges).toHaveLength(2);
    expect(Array.from(result.earnedBadgeIds)).toEqual(
      expect.arrayContaining(["b1", "b2"]),
    );
  });
});
