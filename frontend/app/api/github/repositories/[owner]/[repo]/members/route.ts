import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { GithubApiError, getRepositoryMembers } from "@/lib/github-client";
import type {
  ApiErrorResponse,
  RepositoryMembersResponse,
} from "@/types/github";

function mapGithubApiError(error: GithubApiError): ApiErrorResponse {
  if (error.code === "NOT_INSTALLED") {
    return {
      error: "GitHub App is not installed for this user",
      code: error.code,
    };
  }

  if (error.status === 403) {
    return { error: "Access denied to this repository", code: error.code };
  }

  if (error.status === 404) {
    return { error: "Repository not found", code: error.code };
  }

  return { error: "Failed to fetch repository members", code: error.code };
}

export async function GET(
  _request: Request,
  { params }: { params: { owner: string; repo: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const members = await getRepositoryMembers(
      params.owner,
      params.repo,
      session.accessToken,
    );
    return NextResponse.json<RepositoryMembersResponse>({ members });
  } catch (error) {
    if (error instanceof GithubApiError) {
      if (error.details) {
        console.error(
          "[github/repositories/:owner/:repo/members] Upstream details:",
          error.details,
        );
      }
      return NextResponse.json<ApiErrorResponse>(mapGithubApiError(error), {
        status: error.status,
      });
    }

    console.error("[github/repositories/:owner/:repo/members] Error:", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Failed to fetch repository members", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
