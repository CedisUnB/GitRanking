import { prisma } from "@/lib/prisma";

interface GitHubRepoResponse {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  owner: { login: string };
}

/**
 * Fetches repository metadata from the GitHub API and upserts it into
 * the local Repository table. Safe to call on every page visit — uses
 * githubRepoId as the unique key so renames are handled automatically.
 *
 * Non-fatal: logs errors but never throws, so callers are never blocked.
 */
export async function upsertRepository(
  owner: string,
  repo: string,
  accessToken: string
): Promise<void> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(
        `[repository] GitHub API returned ${res.status} for ${owner}/${repo}`
      );
      return;
    }

    const data: GitHubRepoResponse = await res.json();

    await prisma.repository.upsert({
      where: { githubRepoId: String(data.id) },
      update: {
        // Keep in sync in case the repo was renamed or transferred
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        private: data.private,
      },
      create: {
        githubRepoId: String(data.id),
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        private: data.private,
      },
    });
  } catch (err) {
    console.error("[repository] Failed to upsert repository:", err);
  }
}
