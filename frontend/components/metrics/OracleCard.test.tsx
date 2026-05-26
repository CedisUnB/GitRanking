// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) =>
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img alt={alt} src={src} />,
}));

import { OracleCard } from "./OracleCard";

describe("OracleCard", () => {
  it("renders the title", () => {
    render(<OracleCard status="on_track" />);
    expect(screen.getByText("Oracle")).toBeInTheDocument();
  });

  describe("status messages", () => {
    it("early — singular day", () => {
      render(<OracleCard status="early" daysAhead={1} />);
      expect(
        screen.getByText(/finish 1 day ahead of schedule/i),
      ).toBeInTheDocument();
    });

    it("early — plural days", () => {
      render(<OracleCard status="early" daysAhead={3} />);
      expect(
        screen.getByText(/finish 3 days ahead of schedule/i),
      ).toBeInTheDocument();
    });

    it("on_track", () => {
      render(<OracleCard status="on_track" />);
      expect(
        screen.getByText(/finish on schedule/i),
      ).toBeInTheDocument();
    });

    it("at_risk uses Math.abs and pluralises", () => {
      render(<OracleCard status="at_risk" daysAhead={-2} />);
      expect(
        screen.getByText(/is 2 days behind schedule/i),
      ).toBeInTheDocument();
    });

    it("at_risk singular", () => {
      render(<OracleCard status="at_risk" daysAhead={-1} />);
      expect(
        screen.getByText(/is 1 day behind schedule/i),
      ).toBeInTheDocument();
    });

    it("at_risk defaults daysAhead to 0", () => {
      render(<OracleCard status="at_risk" />);
      expect(
        screen.getByText(/is 0 days behind schedule/i),
      ).toBeInTheDocument();
    });

    it("no_data", () => {
      render(<OracleCard status="no_data" />);
      expect(
        screen.getByText(/Insufficient data/i),
      ).toBeInTheDocument();
    });

    it("no_sprint", () => {
      render(<OracleCard status="no_sprint" />);
      expect(
        screen.getByText(/No active sprint with a due date/i),
      ).toBeInTheDocument();
    });
  });

  describe("status dot color", () => {
    const cases: Array<[
      "early" | "on_track" | "at_risk" | "no_data" | "no_sprint",
      string,
    ]> = [
      ["early", "bg-green-500"],
      ["on_track", "bg-blue-500"],
      ["at_risk", "bg-yellow-400"],
      ["no_data", "bg-slate-400"],
      ["no_sprint", "bg-slate-400"],
    ];

    it.each(cases)("uses %s for status %s", (status, expectedClass) => {
      const { container } = render(<OracleCard status={status} daysAhead={1} />);
      expect(container.innerHTML).toContain(expectedClass);
    });
  });
});
