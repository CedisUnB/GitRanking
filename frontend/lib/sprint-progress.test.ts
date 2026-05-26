import { describe, it, expect } from "vitest";
import { computeSprintProgress } from "./sprint-progress";

const ONE_DAY = 86_400_000;
const START = "2026-01-01T00:00:00.000Z";
const END = "2026-01-15T00:00:00.000Z";

describe("computeSprintProgress", () => {
  it("returns hasSprint: false when sprintStart is null", () => {
    const result = computeSprintProgress({
      openCount: 1,
      closedCount: 0,
      sprintStart: null,
      sprintEnd: END,
    });
    expect(result).toEqual({ hasSprint: false });
  });

  it("returns hasSprint: false when sprintEnd is null", () => {
    const result = computeSprintProgress({
      openCount: 1,
      closedCount: 0,
      sprintStart: START,
      sprintEnd: null,
    });
    expect(result).toEqual({ hasSprint: false });
  });

  it("returns hasSprint: false when dates are invalid", () => {
    const result = computeSprintProgress({
      openCount: 1,
      closedCount: 1,
      sprintStart: "not-a-date",
      sprintEnd: END,
    });
    expect(result).toEqual({ hasSprint: false });
  });

  it("returns percent=0 when no issues exist", () => {
    const result = computeSprintProgress({
      openCount: 0,
      closedCount: 0,
      sprintStart: START,
      sprintEnd: END,
      now: new Date(START).getTime(),
    });
    if (!result.hasSprint) throw new Error("expected hasSprint=true");
    expect(result.percent).toBe(0);
  });

  it("computes percent rounded with clamp to 100", () => {
    const result = computeSprintProgress({
      openCount: 0,
      closedCount: 7,
      sprintStart: START,
      sprintEnd: END,
      now: new Date(START).getTime(),
    });
    if (!result.hasSprint) throw new Error("expected hasSprint=true");
    expect(result.percent).toBe(100);
  });

  it("rounds non-integer percents", () => {
    const result = computeSprintProgress({
      openCount: 2,
      closedCount: 1,
      sprintStart: START,
      sprintEnd: END,
      now: new Date(START).getTime(),
    });
    if (!result.hasSprint) throw new Error("expected hasSprint=true");
    expect(result.percent).toBe(33);
  });

  it("computes daysElapsed/daysTotal/daysRemaining with now midway", () => {
    const startMs = new Date(START).getTime();
    const result = computeSprintProgress({
      openCount: 5,
      closedCount: 5,
      sprintStart: START,
      sprintEnd: END,
      now: startMs + 7 * ONE_DAY,
    });
    if (!result.hasSprint) throw new Error("expected hasSprint=true");
    expect(result.daysTotal).toBe(14);
    expect(result.daysElapsed).toBe(7);
    expect(result.daysRemaining).toBe(7);
    expect(result.isOverdue).toBe(false);
  });

  it("flags isOverdue when now is past sprintEnd", () => {
    const endMs = new Date(END).getTime();
    const result = computeSprintProgress({
      openCount: 1,
      closedCount: 4,
      sprintStart: START,
      sprintEnd: END,
      now: endMs + 3 * ONE_DAY,
    });
    if (!result.hasSprint) throw new Error("expected hasSprint=true");
    expect(result.isOverdue).toBe(true);
    expect(result.daysRemaining).toBe(-3);
    expect(result.daysElapsed).toBe(result.daysTotal);
  });

  it("clamps daysElapsed at 0 when now precedes sprintStart", () => {
    const startMs = new Date(START).getTime();
    const result = computeSprintProgress({
      openCount: 2,
      closedCount: 0,
      sprintStart: START,
      sprintEnd: END,
      now: startMs - 5 * ONE_DAY,
    });
    if (!result.hasSprint) throw new Error("expected hasSprint=true");
    expect(result.daysElapsed).toBe(0);
  });
});
