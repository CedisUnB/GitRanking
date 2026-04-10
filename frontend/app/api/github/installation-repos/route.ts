import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserInstallationId, getInstallationRepos } from "@/lib/github-app";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const installationId = await getUserInstallationId(session.accessToken);

    if (installationId === null) {
      // User has not installed the GitHub App yet
      return NextResponse.json(
        {
          notInstalled: true,
          installUrl: process.env.GITHUB_APP_INSTALLATION_URL,
        },
        { status: 200 }
      );
    }

    const repos = await getInstallationRepos(installationId);

    return NextResponse.json(repos, { status: 200 });
  } catch (err) {
    console.error("[installation-repos] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch installation repositories" },
      { status: 500 }
    );
  }
}
