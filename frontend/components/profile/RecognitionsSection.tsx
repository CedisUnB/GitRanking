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

export function RecognitionsSection({ recognitions }: Props) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white px-6 py-6 shadow-sm">
      <div className="mb-5 flex items-start gap-2">
        <span className="mt-0.5 text-xl" aria-hidden="true">
          🤝
        </span>
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
