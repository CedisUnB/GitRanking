import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handlePush } from "./handlePush";

describe("handlePush", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("returns a 200 Response when commits is empty", async () => {
    const res = await handlePush({ commits: [] });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Push processed");
  });

  it("logs each commit message and returns 200", async () => {
    const res = await handlePush({
      commits: [{ message: "first" }, { message: "second" }],
    });
    expect(res.status).toBe(200);
    expect(logSpy).toHaveBeenCalledWith("Commit:", "first");
    expect(logSpy).toHaveBeenCalledWith("Commit:", "second");
  });
});
