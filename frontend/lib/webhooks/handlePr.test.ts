import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { handlePr } from "./handlePr";

describe("handlePr", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("returns a 200 Response when action is opened", async () => {
    const res = await handlePr({
      action: "opened",
      pull_request: { title: "feat: x", user: { login: "alice" } },
    });
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("PR processed");
  });

  it("returns a 200 Response when action is closed", async () => {
    const res = await handlePr({ action: "closed" });
    expect(res.status).toBe(200);
  });

  it("returns a 200 Response for unknown actions", async () => {
    const res = await handlePr({ action: "labeled" });
    expect(res.status).toBe(200);
  });
});
