"use client";

import { useState } from "react";
import type { RepositoryMemberDto } from "@/types/github";
import { fireRecognitionCreatedConfetti } from "@/lib/recognitionConfetti";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-yellow-100", text: "text-yellow-800" },
  maintain: { bg: "bg-blue-100", text: "text-blue-800" },
  write: { bg: "bg-green-100", text: "text-green-800" },
  triage: { bg: "bg-orange-100", text: "text-orange-800" },
  read: { bg: "bg-slate-100", text: "text-slate-600" },
};

function getRoleColors(role: string | null) {
  if (!role) return { bg: "bg-slate-100", text: "text-slate-600" };
  return ROLE_COLORS[role.toLowerCase()] ?? { bg: "bg-purple-100", text: "text-purple-800" };
}

type GiveRecognitionModalProps = {
  recipientUsername: string;
  owner: string;
  repo: string;
  onClose: () => void;
};

function GiveRecognitionModal({
  recipientUsername,
  owner,
  repo,
  onClose,
}: GiveRecognitionModalProps) {
  const [reason, setReason] = useState("innovation");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!message.trim()) {
      setError("Please write a message.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recognition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUsername, message, reason, owner, repo }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to send recognition.");
        return;
      }
      if (res.status === 201) {
        fireRecognitionCreatedConfetti();
      }
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Give Recognition</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              What&apos;s the reason?
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6B1FA6]/30"
            >
              <option value="innovation">Innovation</option>
              <option value="leadership">Leadership</option>
              <option value="teamwork">Teamwork</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Your Message..
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Write your message here..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6B1FA6]/30 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={loading}
              className="rounded-lg bg-[#6B1FA6] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#5a1a8c] disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  members: RepositoryMemberDto[];
  currentUsername: string;
  owner: string;
  repo: string;
};

export function TeamMembersSection({ members, currentUsername, owner, repo }: Props) {
  const [selectedMember, setSelectedMember] = useState<RepositoryMemberDto | null>(null);

  return (
    <>
      <div className="rounded-[24px] border border-black/10 bg-white px-6 py-6 shadow-sm">
        <div className="mb-5 flex items-start gap-2">
          <span className="mt-0.5 text-xl" aria-hidden="true">
            👥
          </span>
          <div>
            <h2 className="text-[18px] font-semibold leading-6 text-slate-900">
              Team Members
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Members of this repository
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const colors = getRoleColors(member.roleName);
            const isSelf = member.login === currentUsername;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  {member.roleName && (
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}
                    >
                      {member.roleName}
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-800">
                    {member.login}
                  </span>
                </div>

                {!isSelf && (
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="flex items-center gap-2 rounded-lg bg-[#6B1FA6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#5a1a8c]"
                  >
                    Give Recognition
                    <span aria-hidden="true">✨</span>
                  </button>
                )}
              </div>
            );
          })}

          {members.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">
              No members found for this repository.
            </p>
          )}
        </div>
      </div>

      {selectedMember && (
        <GiveRecognitionModal
          recipientUsername={selectedMember.login}
          owner={owner}
          repo={repo}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  );
}
