import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, badgesMock } = vi.hoisted(() => ({
  prismaMock: {
    repository: { findUnique: vi.fn() },
    user: { findFirst: vi.fn() },
    userStats: { upsert: vi.fn() },
    userSprintParticipation: { upsert: vi.fn() },
  },
  badgesMock: {
    evaluateBadgesForUser: vi.fn(),
    awardAllTasksBadgeToMilestoneParticipants: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/badges", () => badgesMock);

import { handleIssue } from "./handleIssue";

const REPO_ROW = { id: "repo-1" };

function resetMocks() {
  for (const ns of Object.values(prismaMock)) {
    for (const fn of Object.values(ns)) {
      (fn as ReturnType<typeof vi.fn>).mockReset();
    }
  }
  badgesMock.evaluateBadgesForUser.mockReset();
  badgesMock.awardAllTasksBadgeToMilestoneParticipants.mockReset();
}

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    action: "opened",
    repository: { id: 999 },
    issue: { user: { login: "alice" }, assignees: [], labels: [] },
    ...overrides,
  };
}

describe("handleIssue", () => {
  beforeEach(resetMocks);

  it("returns 200 without side effects when repository is unknown", async () => {
    prismaMock.repository.findUnique.mockResolvedValue(null);

    const res = await handleIssue(baseBody());

    expect(res.status).toBe(200);
    expect(prismaMock.userStats.upsert).not.toHaveBeenCalled();
    expect(badgesMock.evaluateBadgesForUser).not.toHaveBeenCalled();
  });

  describe("opened", () => {
    beforeEach(() => {
      prismaMock.repository.findUnique.mockResolvedValue(REPO_ROW);
    });

    it("increments issuesCreated and evaluates badges when the user is known", async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: "u1" });

      await handleIssue(baseBody());

      expect(prismaMock.userStats.upsert).toHaveBeenCalledWith({
        where: { userId_repositoryId: { userId: "u1", repositoryId: "repo-1" } },
        update: { issuesCreated: { increment: 1 } },
        create: { userId: "u1", repositoryId: "repo-1", issuesCreated: 1 },
      });
      expect(badgesMock.evaluateBadgesForUser).toHaveBeenCalledWith(
        "u1",
        "repo-1",
      );
    });

    it("does nothing when the issue creator has no User row", async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await handleIssue(baseBody());

      expect(prismaMock.userStats.upsert).not.toHaveBeenCalled();
      expect(badgesMock.evaluateBadgesForUser).not.toHaveBeenCalled();
    });

    it("skips when issue.user.login is missing", async () => {
      await handleIssue(
        baseBody({ issue: { user: {}, assignees: [], labels: [] } }),
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("closed", () => {
    beforeEach(() => {
      prismaMock.repository.findUnique.mockResolvedValue(REPO_ROW);
      prismaMock.user.findFirst.mockResolvedValue({ id: "u1" });
    });

    it("increments issuesClosed for each assignee", async () => {
      prismaMock.user.findFirst
        .mockResolvedValueOnce({ id: "u1" })
        .mockResolvedValueOnce({ id: "u2" });

      await handleIssue(
        baseBody({
          action: "closed",
          issue: {
            assignees: [{ login: "alice" }, { login: "bob" }],
            labels: [],
            milestone: null,
          },
        }),
      );

      expect(prismaMock.userStats.upsert).toHaveBeenCalledTimes(2);
      expect(badgesMock.evaluateBadgesForUser).toHaveBeenCalledTimes(2);
    });

    it("increments bugsClosed when the issue is labelled 'bug'", async () => {
      await handleIssue(
        baseBody({
          action: "closed",
          issue: {
            assignees: [{ login: "alice" }],
            labels: [{ name: "Bug" }],
            milestone: null,
          },
        }),
      );

      const call = prismaMock.userStats.upsert.mock.calls[0][0];
      expect(call.update).toEqual({
        issuesClosed: { increment: 1 },
        bugsClosed: { increment: 1 },
      });
      expect(call.create).toEqual(
        expect.objectContaining({ issuesClosed: 1, bugsClosed: 1 }),
      );
    });

    it("does not increment bugsClosed without the bug label", async () => {
      await handleIssue(
        baseBody({
          action: "closed",
          issue: {
            assignees: [{ login: "alice" }],
            labels: [{ name: "enhancement" }],
            milestone: null,
          },
        }),
      );

      const call = prismaMock.userStats.upsert.mock.calls[0][0];
      expect(call.update).toEqual({ issuesClosed: { increment: 1 } });
      expect(call.create).toEqual(
        expect.objectContaining({ issuesClosed: 1, bugsClosed: 0 }),
      );
    });

    it("records sprint participation when a milestone is present", async () => {
      await handleIssue(
        baseBody({
          action: "closed",
          issue: {
            assignees: [{ login: "alice" }],
            labels: [],
            milestone: { id: 7, open_issues: 2 },
          },
        }),
      );

      expect(prismaMock.userSprintParticipation.upsert).toHaveBeenCalledWith({
        where: {
          userId_repositoryId_milestoneId: {
            userId: "u1",
            repositoryId: "repo-1",
            milestoneId: "7",
          },
        },
        update: {},
        create: { userId: "u1", repositoryId: "repo-1", milestoneId: "7" },
      });
      expect(
        badgesMock.awardAllTasksBadgeToMilestoneParticipants,
      ).not.toHaveBeenCalled();
    });

    it("awards all_tasks when the milestone has no remaining open issues", async () => {
      await handleIssue(
        baseBody({
          action: "closed",
          issue: {
            assignees: [{ login: "alice" }],
            labels: [],
            milestone: { id: 7, open_issues: 0 },
          },
        }),
      );

      expect(
        badgesMock.awardAllTasksBadgeToMilestoneParticipants,
      ).toHaveBeenCalledWith("repo-1", "7");
    });

    it("skips assignees with no user record", async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce(null);

      await handleIssue(
        baseBody({
          action: "closed",
          issue: {
            assignees: [{ login: "ghost" }],
            labels: [],
            milestone: null,
          },
        }),
      );

      expect(prismaMock.userStats.upsert).not.toHaveBeenCalled();
    });
  });
});
