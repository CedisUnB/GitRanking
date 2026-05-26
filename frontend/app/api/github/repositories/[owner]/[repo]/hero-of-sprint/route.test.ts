import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getServerSessionMock,
  upsertRepositoryMock,
  findRepositoryByOwnerAndNameMock,
  resolveHeroOfSprintOverviewMock,
  submitHeroVoteMock,
  getHeroSprintMilestoneContextMock,
  getRepositoryMembersMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  upsertRepositoryMock: vi.fn(),
  findRepositoryByOwnerAndNameMock: vi.fn(),
  resolveHeroOfSprintOverviewMock: vi.fn(),
  submitHeroVoteMock: vi.fn(),
  getHeroSprintMilestoneContextMock: vi.fn(),
  getRepositoryMembersMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/repository", () => ({ upsertRepository: upsertRepositoryMock }));
vi.mock("@/lib/hero-of-sprint", () => ({
  findRepositoryByOwnerAndName: findRepositoryByOwnerAndNameMock,
  resolveHeroOfSprintOverview: resolveHeroOfSprintOverviewMock,
  submitHeroVote: submitHeroVoteMock,
}));
vi.mock("@/lib/github-client", async () => {
  // Re-use the real GithubApiError class so `instanceof` checks pass.
  const actual = await vi.importActual<typeof import("@/lib/github-client")>(
    "@/lib/github-client",
  );
  return {
    GithubApiError: actual.GithubApiError,
    getHeroSprintMilestoneContext: getHeroSprintMilestoneContextMock,
    getRepositoryMembers: getRepositoryMembersMock,
  };
});

import { GET, POST } from "./route";
import { GithubApiError } from "@/lib/github-client";

const sessionWithUser = {
  accessToken: "token",
  user: { githubId: "voter-gh" },
};

const params = { owner: "acme", repo: "repo" };
const getReq = () => new Request("https://example.com/api/hero");
const postReq = (body: unknown) =>
  new Request("https://example.com/api/hero", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const postRaw = (raw: string) =>
  new Request("https://example.com/api/hero", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });

function resetMocks() {
  for (const fn of [
    getServerSessionMock,
    upsertRepositoryMock,
    findRepositoryByOwnerAndNameMock,
    resolveHeroOfSprintOverviewMock,
    submitHeroVoteMock,
    getHeroSprintMilestoneContextMock,
    getRepositoryMembersMock,
  ]) {
    fn.mockReset();
  }
  upsertRepositoryMock.mockResolvedValue(undefined);
}

describe("GET /api/.../hero-of-sprint", () => {
  beforeEach(resetMocks);

  it("returns 401 when there is no session", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(getReq(), { params });
    expect(res.status).toBe(401);
  });

  it("returns the overview on success", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    getHeroSprintMilestoneContextMock.mockResolvedValue({
      current: { githubId: "c1", title: "Sprint 7" },
      previous: null,
    });
    findRepositoryByOwnerAndNameMock.mockResolvedValue({ id: "r1" });
    resolveHeroOfSprintOverviewMock.mockResolvedValue({
      previousHero: null,
      currentSprint: { title: "Sprint 7", githubId: "c1" },
      hasVoted: false,
    });

    const res = await GET(getReq(), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.currentSprint).toEqual({ title: "Sprint 7", githubId: "c1" });
  });

  it("maps NOT_INSTALLED GithubApiError to 404", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    getHeroSprintMilestoneContextMock.mockRejectedValue(
      new GithubApiError("nope", 404, "NOT_INSTALLED"),
    );

    const res = await GET(getReq(), { params });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("NOT_INSTALLED");
  });

  it("maps 403 GithubApiError to 403 'Access denied'", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    getHeroSprintMilestoneContextMock.mockRejectedValue(
      new GithubApiError("forbidden", 403),
    );

    const res = await GET(getReq(), { params });
    expect(res.status).toBe(403);
  });

  it("falls back to 500 for unknown errors", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    getHeroSprintMilestoneContextMock.mockRejectedValue(new Error("kaboom"));

    const res = await GET(getReq(), { params });
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });
});

describe("POST /api/.../hero-of-sprint", () => {
  beforeEach(resetMocks);

  it("returns 401 when there is no session", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await POST(postReq({ nomineeLogin: "alice" }), { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    const res = await POST(postRaw("{not-json"), { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 when nomineeLogin is empty", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    const res = await POST(postReq({ nomineeLogin: "   " }), { params });
    expect(res.status).toBe(400);
  });

  it("returns 409 when there is no current sprint", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    getHeroSprintMilestoneContextMock.mockResolvedValue({
      current: null,
      previous: null,
    });
    findRepositoryByOwnerAndNameMock.mockResolvedValue({ id: "r1" });
    getRepositoryMembersMock.mockResolvedValue([]);

    const res = await POST(postReq({ nomineeLogin: "alice" }), { params });
    expect(res.status).toBe(409);
  });

  it("returns 500 when the repo row is missing", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    getHeroSprintMilestoneContextMock.mockResolvedValue({
      current: { githubId: "c1", title: "Sprint 7" },
      previous: null,
    });
    findRepositoryByOwnerAndNameMock.mockResolvedValue(null);
    getRepositoryMembersMock.mockResolvedValue([
      { id: 1, login: "alice", avatarUrl: "u" },
    ]);

    const res = await POST(postReq({ nomineeLogin: "alice" }), { params });
    expect(res.status).toBe(500);
  });

  it("returns 400 when the nominee is not a repository collaborator", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    getHeroSprintMilestoneContextMock.mockResolvedValue({
      current: { githubId: "c1", title: "Sprint 7" },
      previous: null,
    });
    findRepositoryByOwnerAndNameMock.mockResolvedValue({ id: "r1" });
    getRepositoryMembersMock.mockResolvedValue([
      { id: 1, login: "bob", avatarUrl: "u" },
    ]);

    const res = await POST(postReq({ nomineeLogin: "alice" }), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_NOMINEE");
  });

  it("returns 403 when submitHeroVote throws VOTER_NOT_FOUND", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    getHeroSprintMilestoneContextMock.mockResolvedValue({
      current: { githubId: "c1", title: "Sprint 7" },
      previous: null,
    });
    findRepositoryByOwnerAndNameMock.mockResolvedValue({ id: "r1" });
    getRepositoryMembersMock.mockResolvedValue([
      { id: 1, login: "alice", avatarUrl: "u" },
    ]);
    submitHeroVoteMock.mockRejectedValue(new Error("VOTER_NOT_FOUND"));

    const res = await POST(postReq({ nomineeLogin: "alice" }), { params });
    expect(res.status).toBe(403);
  });

  it("returns ok when the vote is submitted successfully", async () => {
    getServerSessionMock.mockResolvedValue(sessionWithUser);
    getHeroSprintMilestoneContextMock.mockResolvedValue({
      current: { githubId: "c1", title: "Sprint 7" },
      previous: null,
    });
    findRepositoryByOwnerAndNameMock.mockResolvedValue({ id: "r1" });
    getRepositoryMembersMock.mockResolvedValue([
      { id: 99, login: "Alice", avatarUrl: "u" },
    ]);
    submitHeroVoteMock.mockResolvedValue(undefined);

    const res = await POST(postReq({ nomineeLogin: "alice" }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(submitHeroVoteMock).toHaveBeenCalledWith({
      repositoryId: "r1",
      voterGithubId: "voter-gh",
      nominee: { githubId: 99, login: "Alice", avatarUrl: "u" },
      currentSprintGithubId: "c1",
    });
  });
});
