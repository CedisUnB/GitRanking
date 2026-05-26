import { describe, it, expect, vi, beforeEach } from "vitest";

const { handleIssueMock, handlePrMock, handlePushMock } = vi.hoisted(() => ({
  handleIssueMock: vi.fn(),
  handlePrMock: vi.fn(),
  handlePushMock: vi.fn(),
}));

vi.mock("@/lib/webhooks/handleIssue", () => ({ handleIssue: handleIssueMock }));
vi.mock("@/lib/webhooks/handlePr", () => ({ handlePr: handlePrMock }));
vi.mock("@/lib/webhooks/handlePush", () => ({ handlePush: handlePushMock }));

import { POST } from "./route";

function makeRequest(event: string | null, body: unknown): Request {
  const headers = new Headers();
  if (event) headers.set("x-github-event", event);
  return new Request("https://example.com/api/webhook", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/webhook", () => {
  beforeEach(() => {
    handleIssueMock.mockReset();
    handlePrMock.mockReset();
    handlePushMock.mockReset();
    handleIssueMock.mockResolvedValue(new Response("ok", { status: 200 }));
    handlePrMock.mockResolvedValue(new Response("ok", { status: 200 }));
    handlePushMock.mockResolvedValue(new Response("ok", { status: 200 }));
  });

  it("routes issues events to handleIssue", async () => {
    const body = { action: "opened" };
    await POST(makeRequest("issues", body));
    expect(handleIssueMock).toHaveBeenCalledWith(body);
    expect(handlePrMock).not.toHaveBeenCalled();
    expect(handlePushMock).not.toHaveBeenCalled();
  });

  it("routes push events to handlePush", async () => {
    const body = { commits: [] };
    await POST(makeRequest("push", body));
    expect(handlePushMock).toHaveBeenCalledWith(body);
  });

  it("routes pull_request events to handlePr", async () => {
    const body = { action: "closed" };
    await POST(makeRequest("pull_request", body));
    expect(handlePrMock).toHaveBeenCalledWith(body);
  });

  it("returns 200 'Ignored' for unknown events", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await POST(makeRequest("star", {}));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Ignored");
    logSpy.mockRestore();
  });

  it("returns 200 'Ignored' when the x-github-event header is missing", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await POST(makeRequest(null, {}));
    expect(res.status).toBe(200);
    logSpy.mockRestore();
  });
});
