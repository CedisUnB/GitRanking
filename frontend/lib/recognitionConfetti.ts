import confetti from "canvas-confetti";

export type ConfettiOrigin = { x: number; y: number };

const RAINBOW = [
  "#FF1744",
  "#FF9100",
  "#FFEA00",
  "#00E676",
  "#00B0FF",
  "#651FFF",
  "#E040FB",
  "#FF4081",
];

const BRAND_RICH = [
  "#4C0D85",
  "#6B1FA6",
  "#9D4EDD",
  "#C77DFF",
  "#E0AAFF",
  "#FFD60A",
  "#FF6B9D",
  "#00F5D4",
];

const SECRET_PALETTE = [
  "#FFD700",
  "#FFAA00",
  "#FF6B35",
  "#E040FB",
  "#6B1FA6",
  "#FFF8E7",
  "#00E5FF",
];

const BIG_SCALAR = 1.45;
const MEDIUM_SCALAR = 1.2;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Maps a DOM rect to canvas-confetti `origin` (0–1 of viewport). */
export function elementToConfettiOrigin(
  el: HTMLElement,
  opts?: { verticalBias?: number },
): ConfettiOrigin {
  const r = el.getBoundingClientRect();
  const bias = opts?.verticalBias ?? 0.14;
  const x = (r.left + r.width / 2) / window.innerWidth;
  const y = (r.top + r.height * bias) / window.innerHeight;
  return { x: clamp01(x), y: clamp01(y) };
}

export function getRecognitionConfettiOrigin(): ConfettiOrigin | undefined {
  if (typeof document === "undefined") return undefined;
  const el = document.querySelector<HTMLElement>("[data-recognition-confetti-root]");
  if (!el) return undefined;
  return elementToConfettiOrigin(el, { verticalBias: 0.12 });
}

function defaultOrigin(): ConfettiOrigin {
  return { x: 0.5, y: 0.38 };
}

/** Celebration when POST /api/recognition returns 201 — bursts from Recognition card if it exists on screen. */
export function fireRecognitionCreatedConfetti(origin?: ConfettiOrigin): void {
  const o = origin ?? getRecognitionConfettiOrigin() ?? defaultOrigin();
  const colors = [...BRAND_RICH, ...RAINBOW];

  const burst = () => {
    confetti({
      particleCount: 55,
      spread: 88,
      startVelocity: 38,
      origin: o,
      colors,
      scalar: BIG_SCALAR,
      ticks: 220,
    });
    confetti({
      particleCount: 35,
      spread: 120,
      startVelocity: 32,
      origin: o,
      colors: RAINBOW,
      scalar: MEDIUM_SCALAR,
      shapes: ["circle", "square"],
      ticks: 200,
    });
  };

  burst();
  window.setTimeout(burst, 120);
  window.setTimeout(burst, 260);
}

/** One tap on the handshake — from the Recognition block. */
export function fireHandshakeTapConfetti(origin: ConfettiOrigin): void {
  const colors = [...RAINBOW, ...BRAND_RICH];
  confetti({
    particleCount: 48,
    spread: 64,
    startVelocity: 28,
    origin,
    colors,
    scalar: BIG_SCALAR,
    ticks: 140,
    shapes: ["circle", "square"],
  });
  confetti({
    particleCount: 22,
    spread: 42,
    startVelocity: 22,
    angle: 90,
    origin,
    colors: BRAND_RICH,
    scalar: MEDIUM_SCALAR,
    ticks: 120,
  });
}

/** Rapid taps — big rainbow burst from the block. */
export function fireHandshakeSecretConfetti(origin: ConfettiOrigin): void {
  const duration = 2600;
  const animationEnd = Date.now() + duration;
  const colors = [...SECRET_PALETTE, ...RAINBOW];

  const id = window.setInterval(() => {
    if (Date.now() > animationEnd) {
      window.clearInterval(id);
      return;
    }
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      startVelocity: 28,
      origin: { x: clamp01(origin.x - 0.08), y: origin.y },
      colors,
      scalar: BIG_SCALAR,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      startVelocity: 28,
      origin: { x: clamp01(origin.x + 0.08), y: origin.y },
      colors,
      scalar: BIG_SCALAR,
    });
  }, 90);

  confetti({
    particleCount: 200,
    spread: 165,
    startVelocity: 48,
    decay: 0.89,
    origin,
    colors,
    scalar: 1.55,
    ticks: 280,
    shapes: ["circle", "square"],
  });
}
