import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  findRepositoryByOwnerAndName,
  resolveHeroOfSprintOverview,
  submitHeroVote,
} from "@/lib/hero-of-sprint";
import { GithubApiError, getHeroSprintMilestoneContext, getRepositoryMembers } from "@/lib/github-client";
import { upsertRepository } from "@/lib/repository";
import type { ApiErrorResponse, HeroOfSprintOverviewResponse } from "@/types/github";

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

  return { error: "GitHub API request failed", code: error.code };
}

export async function GET(
  _request: Request,
  { params }: { params: { owner: string; repo: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || !session.user.githubId) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    await upsertRepository(params.owner, params.repo, session.accessToken);

    const [milestoneCtx, repoRow] = await Promise.all([
      getHeroSprintMilestoneContext(
        params.owner,
        params.repo,
        session.accessToken,
      ),
      findRepositoryByOwnerAndName(params.owner, params.repo),
    ]);

    const payload = await resolveHeroOfSprintOverview(
      milestoneCtx,
      repoRow,
      session.user.githubId,
    );

    return NextResponse.json<HeroOfSprintOverviewResponse>(payload);
  } catch (error) {
    if (error instanceof GithubApiError) {
      if (error.details) {
        console.error(
          "[hero-of-sprint GET] Upstream details:",
          error.details,
        );
      }
      return NextResponse.json<ApiErrorResponse>(mapGithubApiError(error), {
        status: error.status,
      });
    }

    console.error("[hero-of-sprint GET] Error:", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Failed to load hero of sprint", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { owner: string; repo: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || !session.user.githubId) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let body: { nomineeLogin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const nomineeLogin =
    typeof body.nomineeLogin === "string" ? body.nomineeLogin.trim() : "";
  if (!nomineeLogin) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "nomineeLogin is required", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  try {
    await upsertRepository(params.owner, params.repo, session.accessToken);

    const [milestoneCtx, repoRow, members] = await Promise.all([
      getHeroSprintMilestoneContext(
        params.owner,
        params.repo,
        session.accessToken,
      ),
      findRepositoryByOwnerAndName(params.owner, params.repo),
      getRepositoryMembers(params.owner, params.repo, session.accessToken),
    ]);

    if (!milestoneCtx.current) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "No active sprint to vote on", code: "NO_CURRENT_SPRINT" },
        { status: 409 },
      );
    }

    if (!repoRow) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Repository not synced", code: "REPOSITORY_NOT_FOUND" },
        { status: 500 },
      );
    }

    const member = members.find(
      (m) => m.login.toLowerCase() === nomineeLogin.toLowerCase(),
    );
    if (!member) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Nominee is not a repository collaborator", code: "INVALID_NOMINEE" },
        { status: 400 },
      );
    }

    await submitHeroVote({
      repositoryId: repoRow.id,
      voterGithubId: session.user.githubId,
      nominee: {
        githubId: member.id,
        login: member.login,
        avatarUrl: member.avatarUrl,
      },
      currentSprintGithubId: milestoneCtx.current.githubId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "VOTER_NOT_FOUND") {
      return NextResponse.json<ApiErrorResponse>(
        { error: "User record missing; try signing in again", code: "VOTER_NOT_FOUND" },
        { status: 403 },
      );
    }

    if (error instanceof GithubApiError) {
      if (error.details) {
        console.error(
          "[hero-of-sprint POST] Upstream details:",
          error.details,
        );
      }
      return NextResponse.json<ApiErrorResponse>(mapGithubApiError(error), {
        status: error.status,
      });
    }

    console.error("[hero-of-sprint POST] Error:", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Failed to submit vote", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
