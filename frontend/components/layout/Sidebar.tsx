"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/ui/Buttons/SignOutButton";

export function Sidebar({
  repositoryLabel,
  overviewHref,
  profileHref,
  metricsHref,
  teamHref,
}: {
  repositoryLabel: string;
  overviewHref?: string;
  profileHref?: string;
  metricsHref?: string;
  teamHref?: string;
}) {
  const pathname = usePathname();
  const isOverviewActive = Boolean(overviewHref && pathname === overviewHref);
  const isProfileActive = Boolean(profileHref && pathname === profileHref);
  const isMetricsActive = Boolean(metricsHref && pathname === metricsHref);
  const isTeamActive = Boolean(teamHref && pathname === teamHref);
  const activeClass = "text-[#3C0366] underline underline-offset-4";
  const inactiveClass = "text-slate-500 hover:text-slate-700";
  const repoNameOnly = repositoryLabel.split("/").pop() ?? repositoryLabel;

  return (
    <aside className="w-72 shrink-0 border-r border-black/5 bg-white">
      <div className="flex h-full flex-col px-6 py-6">
        <div className="flex items-center gap-3">
          <Image
            src="/brands/logo-main.png"
            alt="GitRanking"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <span className="text-[17px] font-medium text-black">GitRanking</span>
        </div>

        <nav className="mt-14 flex flex-col">
          {overviewHref ? (
            <Link
              href={overviewHref}
              className={`text-base font-medium leading-6 transition ${
                isOverviewActive ? activeClass : inactiveClass
              }`}
            >
              Overview
            </Link>
          ) : (
            <div
              className="cursor-not-allowed text-base font-medium leading-6 text-slate-400"
              aria-disabled
            >
              Overview
            </div>
          )}

          <div className="my-8 h-px w-full bg-slate-200" />

          {metricsHref ? (
            <Link
              href={metricsHref}
              className={`text-base font-medium leading-6 transition ${
                isMetricsActive ? activeClass : inactiveClass
              }`}
            >
              Metrics
            </Link>
          ) : (
            <div
              className="cursor-not-allowed text-base font-medium leading-6 text-slate-400"
              aria-disabled
            >
              Metrics
            </div>
          )}

          <div className="my-8 h-px w-full bg-slate-200" />

          {profileHref ? (
            <Link
              href={profileHref}
              className={`text-base font-medium leading-6 transition ${
                isProfileActive ? activeClass : inactiveClass
              }`}
            >
              Profile
            </Link>
          ) : (
            <div
              className="cursor-not-allowed text-base font-medium leading-6 text-slate-400"
              aria-disabled
            >
              Profile
            </div>
          )}

          <SignOutButton className="mt-8 w-fit text-left text-base font-medium leading-6 text-red-600 transition hover:text-red-700">
            Log out
          </SignOutButton>
        </nav>

        <div className="mt-auto">
          <div className="mt-6 flex h-[46px] w-full items-center gap-[15px] bg-white">
            <Image
              src="/brands/temp-logo.png"
              alt=""
              aria-hidden="true"
              width={26}
              height={28}
              className="h-7 w-[26px] shrink-0"
            />

            <div className="flex h-[46px] flex-col items-start justify-center">
              <p className="max-w-[151px] truncate text-sm font-normal leading-[22px] text-[#637381]">
                {repoNameOnly}
              </p>
              {teamHref ? (
                <Link
                  href={teamHref}
                  className={`text-base font-medium leading-6 transition ${
                    isTeamActive ? activeClass : inactiveClass
                  }`}
                >
                  Team and Members
                </Link>
              ) : (
                <div
                  className="cursor-not-allowed text-base font-medium leading-6 text-slate-400"
                  aria-disabled
                >
                  Team and Members
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
