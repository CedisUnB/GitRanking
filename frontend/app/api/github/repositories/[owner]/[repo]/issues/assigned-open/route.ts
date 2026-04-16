import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getAssignedOpenIssues, GithubApiError } from "@/lib/github-client";
import type {
  ApiErrorResponse,
  AssignedOpenIssuesResponse,
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

  return { error: "Failed to fetch assigned open issues", code: error.code };
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

  const username = session.user?.username;
  if (!username) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Session username not found", code: "MISSING_USERNAME" },
      { status: 400 },
    );
  }

  try {
    const issues = await getAssignedOpenIssues(
      params.owner,
      params.repo,
      session.accessToken,
      username,
    );
    return NextResponse.json<AssignedOpenIssuesResponse>({
      assignee: username,
      issues,
    });
  } catch (error) {
    if (error instanceof GithubApiError) {
      if (error.details) {
        console.error(
          "[github/repositories/:owner/:repo/issues/assigned-open] Upstream details:",
          error.details,
        );
      }
      return NextResponse.json<ApiErrorResponse>(
        mapGithubApiError(error),
        { status: error.status },
      );
    }

    console.error(
      "[github/repositories/:owner/:repo/issues/assigned-open] Error:",
      error,
    );
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Failed to fetch assigned open issues",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
