import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getCurrentMilestoneIssues, GithubApiError } from "@/lib/github-client";
import type {
  ApiErrorResponse,
  CurrentMilestoneIssuesResponse,
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

  return { error: "Failed to fetch current milestone issues", code: error.code };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const assignee = request.nextUrl.searchParams.get("assignee") ?? undefined;
  const stateParam = request.nextUrl.searchParams.get("state");
  const state = stateParam === "all" ? "all" : "open";

  try {
    const data = await getCurrentMilestoneIssues(
      params.owner,
      params.repo,
      session.accessToken,
      { assignee, state },
    );
    return NextResponse.json<CurrentMilestoneIssuesResponse>(data);
  } catch (error) {
    if (error instanceof GithubApiError) {
      if (error.details) {
        console.error(
          "[github/repositories/:owner/:repo/milestone-current/issues] Upstream details:",
          error.details,
        );
      }
      return NextResponse.json<ApiErrorResponse>(
        mapGithubApiError(error),
        { status: error.status },
      );
    }

    console.error(
      "[github/repositories/:owner/:repo/milestone-current/issues] Error:",
      error,
    );
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Failed to fetch current milestone issues",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
