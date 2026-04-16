import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { upsertRepository } from "@/lib/repository";

type GitHubUserProfile = {
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  company: string | null;
  created_at: string | null;
};

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
  const { user } = session;

  await upsertRepository(owner, repo, session.accessToken);

  let githubProfile: GitHubUserProfile | null = null;

  try {
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });

    if (profileResponse.ok) {
      githubProfile = (await profileResponse.json()) as GitHubUserProfile;
    }
  } catch (error) {
    console.error("[profile] Failed to load GitHub profile:", error);
  }

  const displayName = githubProfile?.name ?? user.name ?? "";
  const displayEmail = githubProfile?.email ?? user.email ?? "";
  const avatarSrc = githubProfile?.avatar_url ?? user.image ?? null;
  const roleLabel = githubProfile?.company ?? "";
  const bio = githubProfile?.bio ?? "";

  const memberSince = githubProfile?.created_at
    ? `Membro desde ${new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(new Date(githubProfile.created_at))}`
    : "";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <main className="mx-auto max-w-6xl">
      <div className="rounded-[24px] border border-black/10 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={displayName}
              width={120}
              height={120}
              className="h-[120px] w-[120px] rounded-full object-cover"
            />
          ) : (
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[#6B1FA6] text-[40px] font-light text-white">
              {initials}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-7 text-slate-900">
              {displayName}
            </h1>
            <p className="mt-1 text-[16px] font-medium leading-6 text-slate-500">
              {roleLabel}
            </p>

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Image
                  src="/brands/mail-icon.png"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0"
                />
                <span>{displayEmail}</span>
              </div>

              <div className="flex items-center gap-2">
                <Image
                  src="/brands/calendar-icon.png"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0"
                />
                <span>{memberSince}</span>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-500">
              {bio}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
