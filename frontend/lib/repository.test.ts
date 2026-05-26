import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    repository: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { upsertRepository } from "./repository";

function makeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

function makeFailResponse(status: number): Response {
  return {
    ok: false,
    status,
    text: async () => "fail",
    json: async () => ({}),
  } as Response;
}

describe("upsertRepository", () => {
  const fetchMock = vi.fn();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    prismaMock.repository.upsert.mockReset();
    fetchMock.mockReset();
    errorSpy.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("upserts the repository with normalised fields on success", async () => {
    fetchMock.mockResolvedValue(
      makeOkResponse({
        id: 123,
        full_name: "acme/repo",
        name: "repo",
        private: false,
        owner: { login: "acme" },
      }),
    );

    await upsertRepository("acme", "repo", "token-abc");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/acme/repo",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-abc",
        }),
      }),
    );
    expect(prismaMock.repository.upsert).toHaveBeenCalledWith({
      where: { githubRepoId: "123" },
      update: {
        owner: "acme",
        name: "repo",
        fullName: "acme/repo",
        private: false,
      },
      create: {
        githubRepoId: "123",
        owner: "acme",
        name: "repo",
        fullName: "acme/repo",
        private: false,
      },
    });
  });

  it("does not upsert when GitHub returns a non-OK status", async () => {
    fetchMock.mockResolvedValue(makeFailResponse(404));

    await upsertRepository("acme", "repo", "token-abc");

    expect(prismaMock.repository.upsert).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("swallows network errors without throwing", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(upsertRepository("acme", "repo", "t")).resolves.toBeUndefined();
    expect(prismaMock.repository.upsert).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("swallows prisma errors without throwing", async () => {
    fetchMock.mockResolvedValue(
      makeOkResponse({
        id: 1,
        full_name: "a/b",
        name: "b",
        private: false,
        owner: { login: "a" },
      }),
    );
    prismaMock.repository.upsert.mockRejectedValue(new Error("db down"));

    await expect(upsertRepository("a", "b", "t")).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});
