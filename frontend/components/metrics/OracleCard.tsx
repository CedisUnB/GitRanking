import Image from "next/image";

export type OracleStatus = "early" | "on_track" | "at_risk" | "no_data" | "no_sprint";

type Props = {
  status: OracleStatus;
  daysAhead?: number;
};

const STATUS_CONFIG: Record<
  OracleStatus,
  { dotColor: string; message: (daysAhead?: number) => string }
> = {
  early: {
    dotColor: "bg-green-500",
    message: (d) =>
      `Based on the team's current velocity, the Oracle predicts that the Sprint will finish ${d} day${d === 1 ? "" : "s"} ahead of schedule`,
  },
  on_track: {
    dotColor: "bg-blue-500",
    message: () =>
      "Based on the team's current velocity, the Oracle predicts the Sprint will finish on schedule",
  },
  at_risk: {
    dotColor: "bg-yellow-400",
    message: (d) =>
      `Based on the team's current velocity, the Oracle predicts the Sprint is ${Math.abs(d ?? 0)} day${Math.abs(d ?? 0) === 1 ? "" : "s"} behind schedule`,
  },
  no_data: {
    dotColor: "bg-slate-400",
    message: () => "Insufficient data — no issues have been closed in this sprint yet",
  },
  no_sprint: {
    dotColor: "bg-slate-400",
    message: () => "No active sprint with a due date was found",
  },
};

export function OracleCard({ status, daysAhead }: Props) {
  const config = STATUS_CONFIG[status];
  const message = config.message(daysAhead);

  return (
    <div className="rounded-2xl border border-[#59168B]/20 bg-[#F8F8F8] p-6 shadow-sm">
      <p className="text-center text-sm font-medium text-slate-700">Oracle</p>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center justify-center rounded-[20px] bg-[#3C0366] p-5"
          style={{
            clipPath:
              "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
            width: 160,
            height: 160,
          }}
        >
          <Image
            src="/brands/images/oracle.png"
            alt="Oracle crystal ball"
            width={100}
            height={100}
            className="object-contain"
          />
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <span
          className={`mt-1 h-3 w-3 shrink-0 rounded-full ${config.dotColor}`}
        />
        <p className="text-sm leading-relaxed text-slate-700">{message}</p>
      </div>
    </div>
  );
}
