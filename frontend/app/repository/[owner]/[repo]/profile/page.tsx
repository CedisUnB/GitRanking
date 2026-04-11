import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { SignOutButton } from "@/components/ui/Buttons/SignOutButton";
import { upsertRepository } from "@/lib/repository";

export default async function RepositoryProfile({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { owner, repo } = params;
  const selectedRepo = `${owner}/${repo}`;
  const { user } = session;

  await upsertRepository(owner, repo, session.accessToken);

  return (
    <main className="min-h-screen bg-[#E9ECF1] font-[family-name:var(--font-geist-sans)]">
      <nav className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Image
            src="/brands/logo-main.png"
            alt="GitRank"
            width={48}
            height={48}
            className="h-10 w-auto"
          />
          <div className="flex items-center gap-4">
            {user.image && (
              <Image
                src={user.image}
                alt={user.username ?? user.name ?? "Avatar"}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full ring-2 ring-[#4B1E78]/20"
              />
            )}
            <span className="text-sm font-medium text-slate-700">
              @{user.username}
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          Selected repository:{" "}
          <span className="font-mono font-medium">{selectedRepo}</span>
        </p>

        <div className="mb-8 rounded-2xl bg-white/90 px-8 py-8 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-5">
            {user.image && (
              <Image
                src={user.image}
                alt={user.username ?? "Avatar"}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {user.name ?? user.username}
              </h1>
              <p className="mt-1 text-base text-slate-500">
                @{user.username}
              </p>
              {user.email && (
                <p className="mt-1 text-sm text-slate-400">{user.email}</p>
              )}
            </div>
            <a
              href={`https://github.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 .5C5.73.5.75 5.78.75 12.3c0 5.22 3.44 9.64 8.2 11.2.6.12.82-.27.82-.58v-2.03c-3.34.74-4.04-1.68-4.04-1.68-.55-1.44-1.34-1.82-1.34-1.82-1.1-.78.08-.76.08-.76 1.22.09 1.86 1.29 1.86 1.29 1.08 1.9 2.83 1.35 3.52 1.03.11-.81.42-1.35.76-1.66-2.66-.32-5.46-1.38-5.46-6.15 0-1.36.46-2.47 1.22-3.34-.12-.32-.53-1.6.12-3.33 0 0 1-.33 3.3 1.28.96-.28 1.99-.41 3.01-.42 1.02.01 2.05.14 3.01.42 2.3-1.61 3.3-1.28 3.3-1.28.65 1.73.24 3.01.12 3.33.76.87 1.22 1.98 1.22 3.34 0 4.79-2.8 5.83-5.47 6.14.43.38.82 1.14.82 2.3v3.4c0 .32.22.7.83.58 4.76-1.56 8.2-5.98 8.2-11.2C23.25 5.78 18.27.5 12 .5z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
