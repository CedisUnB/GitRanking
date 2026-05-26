import { describe, it, expect, vi, beforeEach } from "vitest";

const { getServerSessionMock, prismaMock, awardRecognitionBadgeMock } = vi.hoisted(
  () => ({
    getServerSessionMock: vi.fn(),
    prismaMock: {
      user: { findFirst: vi.fn() },
      repository: { findFirst: vi.fn() },
      recognitionMessage: { create: vi.fn(), findMany: vi.fn() },
    },
    awardRecognitionBadgeMock: vi.fn(),
  }),
);

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/badges", () => ({
  awardRecognitionBadge: awardRecognitionBadgeMock,
}));

import { POST, GET } from "./route";

function makePost(body: unknown): Request {
  return new Request("https://example.com/api/recognition", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGet(query: string): Request {
  return new Request(`https://example.com/api/recognition?${query}`);
}

function resetMocks() {
  getServerSessionMock.mockReset();
  for (const ns of Object.values(prismaMock)) {
    for (const fn of Object.values(ns)) {
      (fn as ReturnType<typeof vi.fn>).mockReset();
    }
  }
  awardRecognitionBadgeMock.mockReset();
}

const senderSession = { user: { username: "sender" } };

describe("POST /api/recognition", () => {
  beforeEach(resetMocks);

  it("returns 401 when there is no session", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await POST(makePost({}));
    expect(res.status).toBe(401);
  });

  it("returns 400 when the body is missing required fields", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    const res = await POST(
      makePost({ message: "x", reason: "innovation", owner: "a" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when the reason is not in the allowed list", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    const res = await POST(
      makePost({
        recipientUsername: "alice",
        message: "great work",
        reason: "spaghetti",
        owner: "acme",
        repo: "repo",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the sender user does not exist", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst.mockResolvedValue(null);
    const res = await POST(
      makePost({
        recipientUsername: "alice",
        message: "great work",
        reason: "innovation",
        owner: "acme",
        repo: "repo",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("rejects self-recognition with 400", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst.mockResolvedValue({
      id: "sender-id",
      username: "sender",
    });
    const res = await POST(
      makePost({
        recipientUsername: "sender",
        message: "self high-five",
        reason: "innovation",
        owner: "acme",
        repo: "repo",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the recipient cannot be found", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst
      .mockResolvedValueOnce({ id: "sender-id", username: "sender" })
      .mockResolvedValueOnce(null);
    const res = await POST(
      makePost({
        recipientUsername: "ghost",
        message: "x",
        reason: "innovation",
        owner: "acme",
        repo: "repo",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when the repository does not exist", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst
      .mockResolvedValueOnce({ id: "sender-id", username: "sender" })
      .mockResolvedValueOnce({ id: "alice-id", username: "alice" });
    prismaMock.repository.findFirst.mockResolvedValue(null);

    const res = await POST(
      makePost({
        recipientUsername: "alice",
        message: "x",
        reason: "innovation",
        owner: "acme",
        repo: "repo",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("creates the recognition and awards the badge on success", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst
      .mockResolvedValueOnce({ id: "sender-id", username: "sender" })
      .mockResolvedValueOnce({ id: "alice-id", username: "alice" });
    prismaMock.repository.findFirst.mockResolvedValue({ id: "repo-id" });
    prismaMock.recognitionMessage.create.mockResolvedValue({ id: "m-1" });

    const res = await POST(
      makePost({
        recipientUsername: "alice",
        message: "  great work  ",
        reason: "innovation",
        owner: "acme",
        repo: "repo",
      }),
    );

    expect(res.status).toBe(201);
    expect(prismaMock.recognitionMessage.create).toHaveBeenCalledWith({
      data: {
        senderId: "sender-id",
        recipientId: "alice-id",
        message: "great work",
        reason: "innovation",
        repositoryId: "repo-id",
      },
    });
    expect(awardRecognitionBadgeMock).toHaveBeenCalledWith(
      "alice-id",
      "repo-id",
      "innovation",
    );
  });

  it("does not award a badge when the reason is 'others'", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst
      .mockResolvedValueOnce({ id: "sender-id", username: "sender" })
      .mockResolvedValueOnce({ id: "alice-id", username: "alice" });
    prismaMock.repository.findFirst.mockResolvedValue({ id: "repo-id" });

    await POST(
      makePost({
        recipientUsername: "alice",
        message: "ok",
        reason: "others",
        owner: "acme",
        repo: "repo",
      }),
    );

    expect(awardRecognitionBadgeMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/recognition", () => {
  beforeEach(resetMocks);

  it("returns 401 when there is no session", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(makeGet("owner=acme&repo=r"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when owner is missing", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    const res = await GET(makeGet("repo=r"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when repo is missing", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    const res = await GET(makeGet("owner=acme"));
    expect(res.status).toBe(400);
  });

  it("returns an empty list when the user record is not found", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst.mockResolvedValue(null);

    const res = await GET(makeGet("owner=acme&repo=r"));
    const body = await res.json();
    expect(body).toEqual({ recognitions: [] });
  });

  it("returns an empty list when the repo is not found", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst.mockResolvedValue({ id: "u1" });
    prismaMock.repository.findFirst.mockResolvedValue(null);

    const res = await GET(makeGet("owner=acme&repo=r"));
    const body = await res.json();
    expect(body).toEqual({ recognitions: [] });
  });

  it("returns the recognition list ordered by createdAt desc", async () => {
    getServerSessionMock.mockResolvedValue(senderSession);
    prismaMock.user.findFirst.mockResolvedValue({ id: "u1" });
    prismaMock.repository.findFirst.mockResolvedValue({ id: "r1" });
    const rows = [
      { id: "m2", message: "newer" },
      { id: "m1", message: "older" },
    ];
    prismaMock.recognitionMessage.findMany.mockResolvedValue(rows);

    const res = await GET(makeGet("owner=acme&repo=r"));
    const body = await res.json();

    expect(prismaMock.recognitionMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: "u1", repositoryId: "r1" },
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(body.recognitions).toEqual(rows);
  });
});
