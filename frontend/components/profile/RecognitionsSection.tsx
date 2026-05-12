"use client";

import { useCallback, useRef } from "react";
import {
  elementToConfettiOrigin,
  fireHandshakeSecretConfetti,
  fireHandshakeTapConfetti,
} from "@/lib/recognitionConfetti";

type Recognition = {
  id: string;
  message: string;
  reason: string;
  createdAt: Date;
  sender: {
    username: string;
    name: string | null;
  };
};

type Props = {
  recognitions: Recognition[];
};

const REASON_LABELS: Record<string, string> = {
  innovation: "Innovation",
  leadership: "Leadership",
  teamwork: "Teamwork",
  others: "Others",
};

const SECRET_TAP_WINDOW_MS = 2000;
const SECRET_TAP_COUNT = 6;
const EASTER_EGG_CONSOLE =
  "%cGitRanking%c · handshake protocol acknowledged 🤝✨";

export function RecognitionsSection({ recognitions }: Props) {
  const blockRef = useRef<HTMLDivElement>(null);
  const handshakeClicksRef = useRef<number[]>([]);
  const secretArmedRef = useRef(true);

  const onHandshakeClick = useCallback(() => {
    const el = blockRef.current;
    if (!el) return;
    const origin = elementToConfettiOrigin(el, { verticalBias: 0.12 });

    const now = Date.now();
    const windowStart = now - SECRET_TAP_WINDOW_MS;
    handshakeClicksRef.current = handshakeClicksRef.current.filter(
      (t) => t > windowStart,
    );
    handshakeClicksRef.current.push(now);

    if (
      secretArmedRef.current &&
      handshakeClicksRef.current.length >= SECRET_TAP_COUNT
    ) {
      secretArmedRef.current = false;
      handshakeClicksRef.current = [];
      fireHandshakeSecretConfetti(origin);
      console.log(
        EASTER_EGG_CONSOLE,
        "color: #6B1FA6; font-weight: bold; font-size: 12px;",
        "color: #64748b; font-size: 11px;",
      );
      window.setTimeout(() => {
        secretArmedRef.current = true;
      }, 8000);
      return;
    }

    fireHandshakeTapConfetti(origin);
  }, []);

  return (
    <div
      ref={blockRef}
      data-recognition-confetti-root
      className="rounded-[24px] border border-black/10 bg-white px-6 py-6 shadow-sm"
    >
      <div className="mb-5 flex items-start gap-2">
        <button
          type="button"
          onClick={onHandshakeClick}
          className="mt-0.5 shrink-0 cursor-pointer rounded-lg p-0.5 text-xl leading-none transition hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1FA6]/40"
          aria-label="Celebration handshake — tap for a surprise"
        >
          <span aria-hidden="true">🤝</span>
        </button>
        <div>
          <h2 className="text-[18px] font-semibold leading-6 text-slate-900">
            Recognition
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Your recognition given by your team members
          </p>
        </div>
      </div>

      {recognitions.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No recognitions yet. Keep up the great work!
        </p>
      ) : (
        <div className="space-y-4">
          {recognitions.map((r) => {
            const senderLabel = r.sender.name ?? r.sender.username;
            const reasonLabel = REASON_LABELS[r.reason] ?? r.reason;

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4"
              >
                <p className="text-sm font-semibold text-slate-800">
                  Given by: {senderLabel}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[#6B1FA6]">
                  Reason: {reasonLabel}
                </p>
                <hr className="my-3 border-slate-200" />
                <p className="text-sm leading-relaxed text-slate-600">
                  {r.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
