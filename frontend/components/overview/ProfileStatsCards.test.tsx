// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileStatsCards } from "./ProfileStatsCards";

describe("ProfileStatsCards", () => {
  it("renders all 4 labels", () => {
    render(
      <ProfileStatsCards
        stats={{
          tasksDone: 0,
          accumulatedPoints: 0,
          sprintsDone: 0,
          commitsDone: 0,
        }}
      />,
    );

    expect(screen.getByText("Tasks done")).toBeInTheDocument();
    expect(screen.getByText("Accumulated Points")).toBeInTheDocument();
    expect(screen.getByText("Sprints done")).toBeInTheDocument();
    expect(screen.getByText("Commits done")).toBeInTheDocument();
  });

  it("formats large numbers using en-US locale", () => {
    render(
      <ProfileStatsCards
        stats={{
          tasksDone: 1234,
          accumulatedPoints: 1000000,
          sprintsDone: 12,
          commitsDone: 9876,
        }}
      />,
    );

    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("9,876")).toBeInTheDocument();
  });
});
