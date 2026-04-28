export type SprintProgress =
  | {
      hasSprint: true;
      percent: number;
      daysElapsed: number;
      daysTotal: number;
      daysRemaining: number;
      isOverdue: boolean;
    }
  | { hasSprint: false };

export function computeSprintProgress(input: {
  openCount: number;
  closedCount: number;
  sprintStart: string | null;
  sprintEnd: string | null;
  now?: number;
}): SprintProgress {
  if (!input.sprintStart || !input.sprintEnd) {
    return { hasSprint: false };
  }

  const now = input.now ?? Date.now();
  const startMs = new Date(input.sprintStart).getTime();
  const endMs = new Date(input.sprintEnd).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { hasSprint: false };
  }

  const totalMs = Math.max(1, endMs - startMs);
  const elapsedMs = Math.max(0, now - startMs);

  const total = input.openCount + input.closedCount;
  const rawPercent = total === 0 ? 0 : (input.closedCount / total) * 100;
  const percent = Math.min(100, Math.max(0, Math.round(rawPercent)));

  const daysTotal = Math.max(1, Math.round(totalMs / 86_400_000));
  const daysElapsed = Math.min(
    daysTotal,
    Math.max(0, Math.round(elapsedMs / 86_400_000)),
  );
  const daysRemaining = Math.round((endMs - now) / 86_400_000);

  return {
    hasSprint: true,
    percent,
    daysElapsed,
    daysTotal,
    daysRemaining,
    isOverdue: daysRemaining < 0,
  };
}
