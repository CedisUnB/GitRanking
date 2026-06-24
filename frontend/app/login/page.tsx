import { GitHubSignInButton } from "@/components/ui/Buttons/GitHubSignInButton";
import Image from "next/image";
import Link from "next/link";

export default function Login() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#E9ECF1] font-[family-name:var(--font-geist-sans)]">
      <Image src="/brands/geometric_pattern.png" alt="" aria-hidden="true"
        width={920}
        height={640}
        className="pointer-events-none absolute left-0 top-0 z-0 h-auto w-[920px] -translate-x-[35%] -translate-y-[35%] opacity-20" />
      <Image src="/brands/geometric_pattern.png" alt="" aria-hidden="true"
        width={920}
        height={640}
        className="pointer-events-none absolute bottom-0 right-0 z-0 h-auto w-[920px] translate-x-[35%] translate-y-[35%] -scale-x-100 -scale-y-100 opacity-20" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-between px-6 py-10 sm:px-10 sm:py-14">
        <section className="flex flex-1 items-center">
          <div className="w-full">
            <div className="mx-auto w-full max-w-md rounded-2xl bg-white/90 px-10 py-10 shadow-[0_18px_60px_rgba(15,23,42,0.14)] ring-1 ring-black/5 backdrop-blur">
              <div className="flex flex-col items-center text-center">
                <Image src="/brands/logo-main.png" alt="GitRank"
                  width={84}
                  height={84}
                  className="h-[84px] w-auto"
                  priority />
                <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-slate-900">
                  Welcome to GitRank!
                </h1>
                <p className="mt-4 max-w-[28ch] text-lg leading-8 text-slate-600">
                  Sync your GitHub, view your Kanban board, earn badges, and
                  climb the team leaderboard.
                </p>
                <GitHubSignInButton />

                <p className="mt-5 text-sm text-slate-900">
                  Don&apos;t have an account?{" "}
                  <Link href="https://github.com/signup" className="font-semibold text-[#4B1E78] underline-offset-4 hover:underline">
                    Sign up on GitHub.
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
        <footer className="mt-12 flex w-full items-center justify-center gap-12 pb-2">
          <Link href="https://www.unb.br" target="_blank" rel="noopener noreferrer">
            <Image src="/brands/unb_logo.png" alt="UnB"
              width={170}
              height={80}
              className="h-16 w-auto opacity-95 transition-opacity hover:opacity-100" />
          </Link>
          <Link href="https://cedis.unb.br" target="_blank" rel="noopener noreferrer">
            <Image src="/brands/cedis_logo.png" alt="CEDIS"
              width={290}
              height={110}
              className="h-24 w-auto opacity-95 transition-opacity hover:opacity-100" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
