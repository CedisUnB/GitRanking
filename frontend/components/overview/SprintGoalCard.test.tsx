// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SprintGoalCard } from "./SprintGoalCard";

function makeData(overrides: Partial<{
  todo: number;
  doing: number;
  review: number;
  done: number;
  sprintGoal: string;
}> = {}) {
  return {
    todo: 0,
    doing: 0,
    review: 0,
    done: 0,
    sprintGoal: "",
    ...overrides,
  };
}

describe("SprintGoalCard", () => {
  it("renders the section heading", () => {
    render(<SprintGoalCard data={makeData()} />);
    expect(screen.getByRole("heading", { name: "SprintGoal" })).toBeInTheDocument();
  });

  it("shows the sprint goal between curly quotes when present", () => {
    render(<SprintGoalCard data={makeData({ sprintGoal: "Ship MVP" })} />);
    expect(screen.getByText("\u201CShip MVP\u201D")).toBeInTheDocument();
  });

  it("falls back to 'No active sprint found' when sprintGoal is empty", () => {
    render(<SprintGoalCard data={makeData()} />);
    expect(screen.getByText("No active sprint found")).toBeInTheDocument();
  });

  it("renders the 4 status labels and counts", () => {
    render(
      <SprintGoalCard
        data={makeData({ done: 3, doing: 2, review: 1, todo: 5, sprintGoal: "x" })}
      />,
    );

    expect(screen.getByText("DONE")).toBeInTheDocument();
    expect(screen.getByText("DOING")).toBeInTheDocument();
    expect(screen.getByText("REVIEW")).toBeInTheDocument();
    expect(screen.getByText("TODO")).toBeInTheDocument();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
