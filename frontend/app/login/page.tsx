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
                <button type="button" className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#4B1E78] px-5 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-[#3F1864] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B1E78] focus-visible:ring-offset-2">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                    <path d="M12 .5C5.73.5.75 5.78.75 12.3c0 5.22 3.44 9.64 8.2 11.2.6.12.82-.27.82-.58v-2.03c-3.34.74-4.04-1.68-4.04-1.68-.55-1.44-1.34-1.82-1.34-1.82-1.1-.78.08-.76.08-.76 1.22.09 1.86 1.29 1.86 1.29 1.08 1.9 2.83 1.35 3.52 1.03.11-.81.42-1.35.76-1.66-2.66-.32-5.46-1.38-5.46-6.15 0-1.36.46-2.47 1.22-3.34-.12-.32-.53-1.6.12-3.33 0 0 1-.33 3.3 1.28.96-.28 1.99-.41 3.01-.42 1.02.01 2.05.14 3.01.42 2.3-1.61 3.3-1.28 3.3-1.28.65 1.73.24 3.01.12 3.33.76.87 1.22 1.98 1.22 3.34 0 4.79-2.8 5.83-5.47 6.14.43.38.82 1.14.82 2.3v3.4c0 .32.22.7.83.58 4.76-1.56 8.2-5.98 8.2-11.2C23.25 5.78 18.27.5 12 .5z" />
                  </svg>
                  Sign in with GitHub
                </button>

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
          <Image src="/brands/unb_logo.png" alt="UnB"
            width={170}
            height={80}
            className="h-16 w-auto opacity-95" />
          <Image src="/brands/cedis_logo.png" alt="CEDIS"
            width={290}
            height={110}
            className="h-24 w-auto opacity-95" />
        </footer>
      </div>
    </main>
  );
}
