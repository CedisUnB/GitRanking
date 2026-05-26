// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { confettiMock } = vi.hoisted(() => ({ confettiMock: vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: confettiMock }));

import {
  elementToConfettiOrigin,
  getRecognitionConfettiOrigin,
  fireRecognitionCreatedConfetti,
  fireHandshakeTapConfetti,
} from "./recognitionConfetti";

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
}

function makeElement(
  rect: Partial<DOMRect>,
  attrs?: Record<string, string>,
): HTMLElement {
  const el = document.createElement("div");
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  }
  el.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => ({}),
      ...rect,
    }) as DOMRect;
  document.body.appendChild(el);
  return el;
}

describe("recognitionConfetti", () => {
  beforeEach(() => {
    confettiMock.mockReset();
    document.body.innerHTML = "";
    setViewport(1000, 800);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("elementToConfettiOrigin", () => {
    it("returns midpoint coordinates as a fraction of the viewport", () => {
      const el = makeElement({ left: 400, top: 200, width: 200, height: 100 });
      const o = elementToConfettiOrigin(el);
      expect(o.x).toBeCloseTo(0.5);
      expect(o.y).toBeCloseTo((200 + 100 * 0.14) / 800);
    });

    it("respects the verticalBias option", () => {
      const el = makeElement({ left: 0, top: 100, width: 200, height: 200 });
      const o = elementToConfettiOrigin(el, { verticalBias: 0.5 });
      expect(o.y).toBeCloseTo((100 + 200 * 0.5) / 800);
    });

    it("clamps coordinates to the [0, 1] range", () => {
      const beyond = makeElement({
        left: 10_000,
        top: 10_000,
        width: 200,
        height: 100,
      });
      const oHigh = elementToConfettiOrigin(beyond);
      expect(oHigh.x).toBe(1);
      expect(oHigh.y).toBe(1);

      const before = makeElement({
        left: -2000,
        top: -2000,
        width: 100,
        height: 100,
      });
      const oLow = elementToConfettiOrigin(before);
      expect(oLow.x).toBe(0);
      expect(oLow.y).toBe(0);
    });
  });

  describe("getRecognitionConfettiOrigin", () => {
    it("returns undefined when the marker element is missing", () => {
      expect(getRecognitionConfettiOrigin()).toBeUndefined();
    });

    it("returns a clamped origin when the marker element exists", () => {
      makeElement(
        { left: 100, top: 100, width: 200, height: 200 },
        { "data-recognition-confetti-root": "" },
      );
      const o = getRecognitionConfettiOrigin();
      expect(o).toBeDefined();
      expect(o!.x).toBeGreaterThanOrEqual(0);
      expect(o!.x).toBeLessThanOrEqual(1);
      expect(o!.y).toBeGreaterThanOrEqual(0);
      expect(o!.y).toBeLessThanOrEqual(1);
    });
  });

  describe("fireRecognitionCreatedConfetti", () => {
    it("fires three bursts (initial + 2 timer ticks)", () => {
      vi.useFakeTimers();
      fireRecognitionCreatedConfetti({ x: 0.5, y: 0.5 });
      expect(confettiMock).toHaveBeenCalledTimes(2);
      vi.advanceTimersByTime(120);
      expect(confettiMock).toHaveBeenCalledTimes(4);
      vi.advanceTimersByTime(140);
      expect(confettiMock).toHaveBeenCalledTimes(6);
    });

    it("falls back to the default origin when nothing is supplied", () => {
      fireRecognitionCreatedConfetti();
      const firstCallArg = confettiMock.mock.calls[0][0];
      expect(firstCallArg.origin).toEqual({ x: 0.5, y: 0.38 });
    });
  });

  describe("fireHandshakeTapConfetti", () => {
    it("fires exactly 2 confetti calls", () => {
      fireHandshakeTapConfetti({ x: 0.3, y: 0.4 });
      expect(confettiMock).toHaveBeenCalledTimes(2);
      expect(confettiMock.mock.calls[0][0].origin).toEqual({ x: 0.3, y: 0.4 });
    });
  });
});
