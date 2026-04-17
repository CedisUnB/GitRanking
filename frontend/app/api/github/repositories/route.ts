import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getAccessibleRepositories } from "@/lib/github-client";
import type { ApiErrorResponse, RepositoriesResponse } from "@/types/github";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const repositories = await getAccessibleRepositories(session.accessToken);

    if (repositories === null) {
      return NextResponse.json<RepositoriesResponse>({
        notInstalled: true,
        installUrl: process.env.GITHUB_APP_INSTALLATION_URL ?? null,
      });
    }

    return NextResponse.json<RepositoriesResponse>({ repositories });
  } catch (error) {
    console.error("[github/repositories] Error:", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Failed to fetch repositories", code: "GITHUB_API_ERROR" },
      { status: 500 },
    );
  }
}
