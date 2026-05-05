"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import type {
  HeroOfSprintOverviewResponse,
  RepositoryMemberDto,
} from "@/types/github";

type Props = {
  owner: string;
  repo: string;
  initialData: HeroOfSprintOverviewResponse;
};

type ModalPhase = "form" | "submitting" | "success";

function apiPath(owner: string, repo: string, suffix: string) {
  return `/api/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${suffix}`;
}

function MemberSelect({
  members,
  selectedLogin,
  onSelect,
  disabled,
  placeholder,
}: {
  members: RepositoryMemberDto[];
  selectedLogin: string;
  onSelect: (login: string) => void;
  disabled: boolean;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const displayLabel =
    selectedLogin ||
    (members.length === 0 ? "No members loaded" : placeholder);

  return (
    <div ref={containerRef} className="relative w-full flex-1">
      <button
        type="button"
        disabled={disabled || members.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          !disabled && members.length > 0 && setOpen((o) => !o)
        }
        className={`flex h-12 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-left text-sm outline-none transition focus:border-violet-600 disabled:cursor-not-allowed disabled:opacity-60 ${selectedLogin === "" ? "text-slate-400" : "text-slate-800"}`}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && !disabled && members.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {members.map((m) => {
            const isSelected = selectedLogin === m.login;
            return (
              <li key={m.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full truncate px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-violet-50 ${isSelected ? "bg-violet-50 font-medium" : ""}`}
                  onClick={() => {
                    onSelect(m.login);
                    setOpen(false);
                  }}
                >
                  {m.login}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function HeroOfSprintCard({ owner, repo, initialData }: Props) {
  const router = useRouter();
  const [overview, setOverview] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPhase, setModalPhase] = useState<ModalPhase>("form");
  const [members, setMembers] = useState<RepositoryMemberDto[] | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedLogin, setSelectedLogin] = useState("");
  const [voteError, setVoteError] = useState<string | null>(null);

  const titleId = useId();
  const descId = useId();
  const closeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setOverview(initialData);
  }, [initialData]);

  useEffect(() => {
    return () => {
      closeTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      setModalVisible(false);
      return;
    }
    const id = requestAnimationFrame(() => setModalVisible(true));
    return () => cancelAnimationFrame(id);
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && modalPhase === "form") closeModalFromUser();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, modalPhase]);

  useEffect(() => {
    if (!modalOpen) return;

    setMembers(null);
    setMembersError(null);
    setSelectedLogin("");
    setVoteError(null);
    setModalPhase("form");

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiPath(owner, repo, "/members"));
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Failed to load members",
          );
        }
        if (!cancelled) {
          setMembers(data.members as RepositoryMemberDto[]);
        }
      } catch (e) {
        if (!cancelled) {
          setMembersError(
            e instanceof Error ? e.message : "Failed to load members",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modalOpen, owner, repo]);

  function scheduleCloseModal() {
    setModalVisible(false);
    const t = setTimeout(() => {
      setModalOpen(false);
      setModalPhase("form");
    }, 300);
    closeTimers.current.push(t);
  }

  function closeModalFromUser() {
    if (modalPhase !== "form") return;
    scheduleCloseModal();
  }

  async function submitVote() {
    if (!selectedLogin) {
      setVoteError("Select a team member.");
      return;
    }
    setModalPhase("submitting");
    setVoteError(null);
    try {
      const res = await fetch(apiPath(owner, repo, "/hero-of-sprint"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomineeLogin: selectedLogin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Vote failed",
        );
      }
      setModalPhase("success");
      setOverview((o) => ({ ...o, hasVoted: true }));

      const t1 = setTimeout(() => {
        scheduleCloseModal();
        router.refresh();
      }, 1400);
      closeTimers.current.push(t1);
    } catch (e) {
      setModalPhase("form");
      setVoteError(e instanceof Error ? e.message : "Vote failed");
    }
  }

  const bodyText = (() => {
    if (overview.previousHero) {
      const { displayName, sprintTitle } = overview.previousHero;
      return `${displayName} was the Hero of Sprint in “${sprintTitle}”.`;
    }
    if (!overview.currentSprint) {
      return "No active sprint — voting opens when a sprint milestone is in progress.";
    }
    if (overview.hasVoted) {
      return `Your vote for “${overview.currentSprint.title}” is recorded. When that sprint closes, you’ll see the team’s Hero of Sprint from the previous sprint here.`;
    }
    return "No hero was tallied for the last closed sprint yet. Cast your vote for the current sprint below.";
  })();

  const canVote = Boolean(overview.currentSprint);
  const voteCtaLabel = overview.hasVoted
    ? "Change your vote"
    : "Vote for the Hero of Sprint";

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-center text-xl font-semibold text-slate-900">
          Hero of Sprint
        </h2>

        <div className="mt-4 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <div className="flex shrink-0 justify-center sm:w-[120px]">
            {/* Native img: reliable for local PNGs (next/image can fail on some assets). */}
            <img
              src="/recognition/hero.png"
              alt="Hero of Sprint"
              width={120}
              height={140}
              className="h-auto w-[100px] max-w-none object-contain sm:w-[120px]"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="rounded-xl border border-purple-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              {bodyText}
            </p>
            <button
              type="button"
              disabled={!canVote}
              onClick={() => setModalOpen(true)}
              className="mt-4 w-full rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {voteCtaLabel}
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${modalVisible ? "opacity-100" : "opacity-0"}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 transition-opacity duration-300"
            onClick={() => closeModalFromUser()}
            aria-label="Close dialog"
          />

          <div
            className={`relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-300 ease-out ${modalVisible ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]"}`}
          >
            {modalPhase === "success" ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 shadow-sm ring-4 ring-green-50">
                  <Check className="h-9 w-9" strokeWidth={2.5} />
                </div>
                <p className="mt-4 text-center text-base font-medium text-slate-900">
                  Vote saved
                </p>
                <p className="mt-1 text-center text-sm text-slate-600">
                  Thanks for recognizing your teammate.
                </p>
              </div>
            ) : modalPhase === "submitting" ? (
              <div className="flex flex-col items-center justify-center py-14">
                <Loader2
                  className="h-10 w-10 animate-spin text-purple-700"
                  aria-hidden
                />
                <p className="mt-4 text-sm font-medium text-slate-700">
                  Submitting your vote…
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                    Hero of Sprint
                  </h2>
                  <button
                    type="button"
                    onClick={() => closeModalFromUser()}
                    className="rounded-lg p-1 text-purple-700 transition hover:bg-purple-50"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </button>
                </div>

                <p
                  id={descId}
                  className="mt-3 text-sm leading-relaxed text-slate-700"
                >
                  Recognition granted to the team member who most contributed to a
                  positive environment during the sprint. Indicate someone who
                  supported the team, removed impediments, or inspired collaboration.
                  All nominations and votes are anonymous.
                </p>

                {overview.currentSprint && (
                  <p className="mt-3 text-sm font-medium text-purple-700">
                    Vote for your choice in current sprint (
                    {overview.currentSprint.title})
                  </p>
                )}

                {membersError && (
                  <p className="mt-3 text-sm text-red-600">{membersError}</p>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <MemberSelect
                    members={members ?? []}
                    selectedLogin={selectedLogin}
                    onSelect={setSelectedLogin}
                    disabled={!members || members.length === 0}
                    placeholder="Team members"
                  />
                  <button
                    type="button"
                    onClick={() => void submitVote()}
                    disabled={!members || members.length === 0}
                    className="h-12 w-full shrink-0 rounded-lg bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Vote
                  </button>
                </div>

                {voteError && (
                  <p className="mt-2 text-sm text-red-600">{voteError}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
