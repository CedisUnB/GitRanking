import {
  getInstallationRepos,
  getUserInstallationId,
  getInstallationToken,
} from "@/lib/github-app";
import type {
  IssueDto,
  MilestoneDto,
  RepositoryDto,
  RepositoryMemberDto,
} from "@/types/github";

const GITHUB_API_VERSION = "2022-11-28";

type GithubIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  assignees: Array<{ login: string }>;
  labels: Array<{ name: string }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  milestone: {
    number: number;
    title: string;
    due_on: string | null;
    description: string | null;
    created_at: string;
  } | null;
  pull_request?: unknown;
};

type GithubMilestone = {
  number: number;
  title: string;
  due_on: string | null;
  description: string | null;
  created_at: string;
};

type GithubCollaborator = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  role_name?: string;
  permissions?: {
    pull?: boolean;
    push?: boolean;
    admin?: boolean;
  };
};

type GithubAuthenticatedUser = {
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  company: string | null;
  created_at: string | null;
};

export class GithubApiError extends Error {
  status: number;
  code: string;
  details?: string;

  constructor(
    message: string,
    status: number,
    code = "GITHUB_API_ERROR",
    details?: string,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

async function githubFetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: buildHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GithubApiError(
      "GitHub API request failed",
      response.status,
      "GITHUB_API_ERROR",
      text,
    );
  }

  return (await response.json()) as T;
}

async function githubPaginatedFetchJson<T>(
  urlBase: string,
  token: string,
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    const separator = urlBase.includes("?") ? "&" : "?";
    const pageUrl = `${urlBase}${separator}per_page=100&page=${page}`;
    const data = await githubFetchJson<T[]>(pageUrl, token);
    results.push(...data);
    if (data.length < 100) break;
    page += 1;
  }

  return results;
}

function toMilestoneDto(value: GithubMilestone): MilestoneDto {
  return {
    number: value.number,
    title: value.title,
    dueOn: value.due_on,
    description: value.description,
    createdAt: value.created_at,
  };
}

function toIssueDto(value: GithubIssue): IssueDto {
  return {
    id: value.id,
    number: value.number,
    title: value.title,
    state: value.state,
    url: value.html_url,
    assignees: (value.assignees ?? []).map((a) => a.login),
    labels: (value.labels ?? []).map((l) => l.name),
    createdAt: value.created_at,
    updatedAt: value.updated_at,
    closedAt: value.closed_at,
    milestone: value.milestone ? toMilestoneDto(value.milestone) : null,
  };
}

export async function getInstallationIdForUser(
  userAccessToken: string,
): Promise<number> {
  const installationId = await getUserInstallationId(userAccessToken);
  if (installationId === null) {
    throw new GithubApiError(
      "GitHub App not installed for user",
      404,
      "NOT_INSTALLED",
    );
  }

  return installationId;
}

export async function getAccessibleRepositories(
  userAccessToken: string,
): Promise<RepositoryDto[] | null> {
  const installationId = await getUserInstallationId(userAccessToken);
  if (installationId === null) return null;

  const repos = await getInstallationRepos(installationId);
  return repos.map((repo) => {
    const [owner, name] = repo.full_name.split("/");
    return {
      id: repo.id,
      owner: owner ?? "",
      name: name ?? "",
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
    };
  });
}

export async function getRepositoryMembers(
  owner: string,
  repo: string,
  userAccessToken: string,
): Promise<RepositoryMemberDto[]> {
  const installationId = await getInstallationIdForUser(userAccessToken);
  const installationToken = await getInstallationToken(installationId);
  const data = await githubPaginatedFetchJson<GithubCollaborator>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators`,
    installationToken,
  );

  return data.map((member) => ({
    id: member.id,
    login: member.login,
    avatarUrl: member.avatar_url,
    htmlUrl: member.html_url,
    roleName: member.role_name ?? null,
    permissions: {
      pull: Boolean(member.permissions?.pull),
      push: Boolean(member.permissions?.push),
      admin: Boolean(member.permissions?.admin),
    },
  }));
}

export async function getCurrentMilestoneIssues(
  owner: string,
  repo: string,
  userAccessToken: string,
  options?: { assignee?: string; state?: "open" | "all" },
): Promise<{ currentMilestone: MilestoneDto | null; issues: IssueDto[] }> {
  const installationId = await getInstallationIdForUser(userAccessToken);
  const installationToken = await getInstallationToken(installationId);

  const milestones = await githubPaginatedFetchJson<GithubMilestone>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=open&sort=due_on&direction=asc`,
    installationToken,
  );

  const now = Date.now();
  const currentMilestone = milestones.find((milestone) => {
    if (!milestone.due_on) return false;
    return new Date(milestone.due_on).getTime() >= now;
  });

  if (!currentMilestone) {
    return { currentMilestone: null, issues: [] };
  }

  const query = new URLSearchParams({
    milestone: String(currentMilestone.number),
    state: options?.state ?? "open",
  });
  if (options?.assignee) query.set("assignee", options.assignee);

  const issues = await githubPaginatedFetchJson<GithubIssue>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?${query.toString()}`,
    installationToken,
  );

  return {
    currentMilestone: toMilestoneDto(currentMilestone),
    issues: issues.filter((issue) => !issue.pull_request).map(toIssueDto),
  };
}

export async function getAssignedOpenIssues(
  owner: string,
  repo: string,
  userAccessToken: string,
  username: string,
): Promise<IssueDto[]> {
  const installationId = await getInstallationIdForUser(userAccessToken);
  const installationToken = await getInstallationToken(installationId);
  const query = new URLSearchParams({
    assignee: username,
    state: "open",
    milestone: "*",
  });

  const issues = await githubPaginatedFetchJson<GithubIssue>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?${query.toString()}`,
    installationToken,
  );

  return issues.filter((issue) => !issue.pull_request).map(toIssueDto);
}

export async function getAuthenticatedUserProfile(
  userAccessToken: string
): Promise<GithubAuthenticatedUser> {
  return githubFetchJson<GithubAuthenticatedUser>(
    "https://api.github.com/user",
    userAccessToken
  );
}

export type MilestoneVelocityData = {
  currentMilestone: MilestoneDto | null;
  openCount: number;
  closedCount: number;
};

export async function getMilestoneVelocityData(
  owner: string,
  repo: string,
  userAccessToken: string,
): Promise<MilestoneVelocityData> {
  const installationId = await getInstallationIdForUser(userAccessToken);
  const installationToken = await getInstallationToken(installationId);

  const milestones = await githubPaginatedFetchJson<GithubMilestone>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=open&sort=due_on&direction=asc`,
    installationToken,
  );

  const now = Date.now();
  const currentMilestone = milestones.find((m) => {
    if (!m.due_on) return false;
    return new Date(m.due_on).getTime() >= now;
  });

  if (!currentMilestone) {
    return { currentMilestone: null, openCount: 0, closedCount: 0 };
  }

  const [openIssues, closedIssues] = await Promise.all([
    githubPaginatedFetchJson<GithubIssue>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?milestone=${currentMilestone.number}&state=open`,
      installationToken,
    ),
    githubPaginatedFetchJson<GithubIssue>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?milestone=${currentMilestone.number}&state=closed`,
      installationToken,
    ),
  ]);

  const openCount = openIssues.filter((i) => !i.pull_request).length;
  const closedCount = closedIssues.filter((i) => !i.pull_request).length;

  return {
    currentMilestone: toMilestoneDto(currentMilestone),
    openCount,
    closedCount,
  };
}
