import {
  getInstallationRepos,
  getUserInstallationId,
  getInstallationToken,
  getInstallationIdsForUser,
  getInstallationIdForOwner,
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
  /** Present on milestone list API; may be omitted on embedded issue milestone. */
  id?: number;
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

/**
 * Returns the installation token for a specific repo owner (org or personal).
 * Uses the App JWT to look up the installation directly — no user token needed.
 * Throws NOT_INSTALLED if the app is not installed for that owner.
 */
export async function getInstallationIdForUser(
  _userAccessToken: string,
  owner?: string,
): Promise<number> {
  // If we know the owner, use the direct App JWT lookup (works for orgs + users)
  if (owner) {
    const installationId = await getInstallationIdForOwner(owner);
    if (installationId !== null) return installationId;
    throw new GithubApiError(
      "GitHub App not installed for this owner",
      404,
      "NOT_INSTALLED",
    );
  }

  // Fallback: legacy user-installations lookup (personal accounts only)
  const installationId = await getUserInstallationId(_userAccessToken);
  if (installationId === null) {
    throw new GithubApiError(
      "GitHub App not installed for user",
      404,
      "NOT_INSTALLED",
    );
  }
  return installationId;
}

/**
 * Returns all repos the logged-in user can access via this GitHub App —
 * including repos from orgs the user is a member of, and their personal account.
 */
export async function getAccessibleRepositories(
  userAccessToken: string,
): Promise<RepositoryDto[] | null> {
  const installationIds = await getInstallationIdsForUser(userAccessToken);
  if (installationIds.length === 0) return null;

  const allRepos = await Promise.all(
    installationIds.map((id) => getInstallationRepos(id)),
  );

  const seen = new Set<number>();
  return allRepos
    .flat()
    .filter((repo) => {
      if (seen.has(repo.id)) return false;
      seen.add(repo.id);
      return true;
    })
    .map((repo) => {
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
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
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
  options?: {
    assignee?: string;
    state?: "open" | "all";
    includeOverdue?: boolean;
  },
): Promise<{ currentMilestone: MilestoneDto | null; issues: IssueDto[] }> {
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
  const installationToken = await getInstallationToken(installationId);

  const milestones = await githubPaginatedFetchJson<GithubMilestone>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=open&sort=due_on&direction=asc`,
    installationToken,
  );

  const now = Date.now();
  const future = milestones.find((milestone) => {
    if (!milestone.due_on) return false;
    return new Date(milestone.due_on).getTime() >= now;
  });
  let overdue: GithubMilestone | undefined;
  if (!future && options?.includeOverdue) {
    for (const m of milestones) {
      if (m.due_on && new Date(m.due_on).getTime() < now) overdue = m;
    }
  }
  const currentMilestone = future ?? overdue;

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

export type HeroSprintMilestoneRef = {
  githubId: string;
  title: string;
};

export type HeroSprintMilestoneContext = {
  current: HeroSprintMilestoneRef | null;
  previous: HeroSprintMilestoneRef | null;
};

/**
 * Current sprint: same rule as layout/velocity (open milestone with future due date,
 * or most recent overdue open milestone when includeOverdue applies).
 * Previous sprint: most recently closed milestone by due date (GitHub sort).
 */
export async function getHeroSprintMilestoneContext(
  owner: string,
  repo: string,
  userAccessToken: string,
): Promise<HeroSprintMilestoneContext> {
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
  const installationToken = await getInstallationToken(installationId);

  const openMilestones = await githubPaginatedFetchJson<GithubMilestone>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=open&sort=due_on&direction=asc`,
    installationToken,
  );

  const now = Date.now();
  const future = openMilestones.find((milestone) => {
    if (!milestone.due_on) return false;
    return new Date(milestone.due_on).getTime() >= now;
  });
  let overdue: GithubMilestone | undefined;
  if (!future) {
    for (const m of openMilestones) {
      if (m.due_on && new Date(m.due_on).getTime() < now) overdue = m;
    }
  }
  const currentRaw = future ?? overdue;

  const closedSlice = await githubFetchJson<GithubMilestone[]>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=closed&sort=due_on&direction=desc&per_page=1`,
    installationToken,
  );
  const previousRaw = closedSlice[0] ?? null;

  return {
    current:
      currentRaw && currentRaw.id != null
        ? { githubId: String(currentRaw.id), title: currentRaw.title }
        : null,
    previous:
      previousRaw && previousRaw.id != null
        ? { githubId: String(previousRaw.id), title: previousRaw.title }
        : null,
  };
}

export async function getAssignedOpenIssues(
  owner: string,
  repo: string,
  userAccessToken: string,
  username: string,
): Promise<IssueDto[]> {
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
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
  options?: { includeOverdue?: boolean },
): Promise<MilestoneVelocityData> {
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
  const installationToken = await getInstallationToken(installationId);

  const milestones = await githubPaginatedFetchJson<GithubMilestone>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=open&sort=due_on&direction=asc`,
    installationToken,
  );

  const now = Date.now();
  const future = milestones.find((m) => {
    if (!m.due_on) return false;
    return new Date(m.due_on).getTime() >= now;
  });
  let overdue: GithubMilestone | undefined;
  if (!future && options?.includeOverdue) {
    for (const m of milestones) {
      if (m.due_on && new Date(m.due_on).getTime() < now) overdue = m;
    }
  }
  const currentMilestone = future ?? overdue;

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

// ---------------------------------------------------------------------------
// GitHub Projects v2 — GraphQL helpers (org-level)
// ---------------------------------------------------------------------------

type GraphQLResponse<T> = { data: T; errors?: Array<{ message: string }> };

type ProjectsV2Nodes = Array<{
  items: {
    nodes: Array<{
      fieldValues: {
        nodes: Array<
          | {
              __typename: "ProjectV2ItemFieldNumberValue";
              number: number | null;
              field: { name: string };
            }
          | {
              __typename: "ProjectV2ItemFieldSingleSelectValue";
              name: string;
              field: { name: string };
            }
          | { __typename: string }
        >;
      };
      content: {
        __typename: string;
        number?: number;
        repository?: { nameWithOwner: string };
      } | null;
    }>;
  };
}>;

type OrgProjectsV2Response = {
  organization: { projectsV2: { nodes: ProjectsV2Nodes } };
};

async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GithubApiError(
      "GitHub GraphQL request failed",
      response.status,
      "GRAPHQL_ERROR",
      text,
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    const message = json.errors.map((e) => e.message).join("; ");

    if (message.includes("Resource not accessible")) {
      throw new GithubApiError(
        "Missing permissions for GitHub Projects v2",
        403,
        "INSUFFICIENT_PERMISSIONS",
        message,
      );
    }

    throw new GithubApiError(
      "GitHub GraphQL errors",
      422,
      "GRAPHQL_ERROR",
      message,
    );
  }
  return json.data;
}

const ESTIMATE_FIELD_NAMES = [
  "estimate",
  "story points",
  "story point",
  "sp",
  "points",
];

type ProjectData = {
  /** issue number → estimate value (from Estimate / Story Points field) */
  estimateMap: Map<number, number>;
  /** issue number → Status option name (e.g. "In Progress") */
  statusMap: Map<number, string>;
};

/**
 * Queries GitHub Projects v2 for the given organization and returns estimate
 * and status field values keyed by issue number, filtered to issues belonging
 * to `owner/repo`.
 *
 * Uses the GitHub App installation token. Requires the GitHub App to have
 * "Organization permissions → Projects: Read" granted.
 */
async function getProjectData(
  owner: string,
  repo: string,
  installationToken: string,
): Promise<ProjectData> {
  const projectsFragment = `
    projectsV2(first: 20) {
      nodes {
        items(first: 100) {
          nodes {
            fieldValues(first: 20) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldNumberValue {
                  number
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2FieldCommon { name } }
                }
              }
            }
            content {
              __typename
              ... on Issue {
                number
                repository { nameWithOwner }
              }
            }
          }
        }
      }
    }
  `;

  const orgQuery = `query($login: String!) { organization(login: $login) { ${projectsFragment} } }`;
  const repoFullName = `${owner}/${repo}`.toLowerCase();
  let projectNodes: ProjectsV2Nodes = [];

  try {
    const data = await githubGraphQL<OrgProjectsV2Response>(
      orgQuery,
      { login: owner },
      installationToken,
    );
    projectNodes = data.organization.projectsV2.nodes;
    // console.log(
    //   `[projects] org="${owner}" projects=${projectNodes.length}`,
    // );
  } catch (err) {
    console.error(
      "[projects] GraphQL failed — estimates and status will be empty:",
      err,
    );
    return { estimateMap: new Map(), statusMap: new Map() };
  }

  const estimateMap = new Map<number, number>();
  const statusMap = new Map<number, string>();

  for (const project of projectNodes) {
    for (const item of project.items.nodes) {
      if (item.content?.__typename !== "Issue") continue;
      if (!item.content.number) continue;
      if (
        item.content.repository?.nameWithOwner?.toLowerCase() !== repoFullName
      )
        continue;

      const issueNumber = item.content.number;

      for (const fv of item.fieldValues.nodes) {
        if (
          fv.__typename === "ProjectV2ItemFieldNumberValue" &&
          !estimateMap.has(issueNumber)
        ) {
          const typedFv = fv as {
            __typename: "ProjectV2ItemFieldNumberValue";
            number: number | null;
            field: { name: string };
          };
          if (
            ESTIMATE_FIELD_NAMES.includes(typedFv.field.name.toLowerCase()) &&
            typedFv.number != null
          ) {
            estimateMap.set(issueNumber, typedFv.number);
          }
        }

        if (
          fv.__typename === "ProjectV2ItemFieldSingleSelectValue" &&
          !statusMap.has(issueNumber)
        ) {
          const typedFv = fv as {
            __typename: "ProjectV2ItemFieldSingleSelectValue";
            name: string;
            field: { name: string };
          };
          if (typedFv.field.name.toLowerCase() === "status") {
            statusMap.set(issueNumber, typedFv.name);
          }
        }
      }
    }
  }

  // console.log(
  //   `[projects] estimateMap=${estimateMap.size} statusMap=${statusMap.size}`,
  // );

  return { estimateMap, statusMap };
}

// ---------------------------------------------------------------------------
// Work In Progress
// ---------------------------------------------------------------------------

export type WipStatus = "todo" | "doing" | "review" | "done";

export type WorkInProgressData = {
  todo: number;
  doing: number;
  review: number;
  done: number;
  sprintGoal: string;
};

const STATUS_TODO = ["todo", "to do", "backlog", "ready"];
const STATUS_DOING = ["doing", "in progress", "wip", "in development"];
const STATUS_REVIEW = ["review", "in review", "in testing", "testing"];
const STATUS_DONE = ["done", "completed", "closed"];

function classifyByProjectStatus(statusName: string): WipStatus {
  const s = statusName.toLowerCase();
  if (STATUS_DONE.some((k) => s.includes(k))) return "done";
  if (STATUS_REVIEW.some((k) => s.includes(k))) return "review";
  if (STATUS_DOING.some((k) => s.includes(k))) return "doing";
  if (STATUS_TODO.some((k) => s.includes(k))) return "todo";
  // Unknown status option — treat as todo
  return "todo";
}

export async function getWorkInProgressData(
  owner: string,
  repo: string,
  userAccessToken: string,
): Promise<WorkInProgressData> {
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
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
    return { todo: 0, doing: 0, review: 0, done: 0, sprintGoal: "" };
  }

  const [issues, { statusMap }] = await Promise.all([
    githubPaginatedFetchJson<GithubIssue>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?milestone=${currentMilestone.number}&state=all`,
      installationToken,
    ),
    getProjectData(owner, repo, installationToken),
  ]);

  const counts: WorkInProgressData = { todo: 0, doing: 0, review: 0, done: 0, sprintGoal: currentMilestone.title };

  for (const issue of issues) {
    if (issue.pull_request) continue;

    // Closed issues are always "done" regardless of project status
    if (issue.state === "closed") {
      counts.done += 1;
      continue;
    }

    const projectStatus = statusMap.get(issue.number);
    if (projectStatus) {
      counts[classifyByProjectStatus(projectStatus)] += 1;
    } else {
      // Issue not in any project board — treat as todo
      counts.todo += 1;
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// User ongoing tasks (overview page)
// ---------------------------------------------------------------------------

export type OngoingTaskStatus = "todo" | "doing" | "review";

export type OngoingTaskDto = {
  id: number;
  number: number;
  title: string;
  url: string;
  status: OngoingTaskStatus;
  points: number | null;
};

export async function getUserOngoingTasks(
  owner: string,
  repo: string,
  username: string,
  userAccessToken: string,
): Promise<OngoingTaskDto[]> {
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
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

  if (!currentMilestone) return [];

  const query = new URLSearchParams({
    milestone: String(currentMilestone.number),
    state: "open",
    assignee: username,
  });

  const [issues, projectData] = await Promise.all([
    githubPaginatedFetchJson<GithubIssue>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?${query.toString()}`,
      installationToken,
    ),
    getProjectData(owner, repo, installationToken),
  ]);

  const tasks: OngoingTaskDto[] = [];
  for (const issue of issues) {
    if (issue.pull_request) continue;
    const projectStatus = projectData.statusMap.get(issue.number);
    const wip: WipStatus = projectStatus
      ? classifyByProjectStatus(projectStatus)
      : "todo";
    if (wip === "done") continue;
    tasks.push({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      status: wip,
      points: projectData.estimateMap.get(issue.number) ?? null,
    });
  }

  const order: OngoingTaskStatus[] = ["doing", "review", "todo"];
  tasks.sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status),
  );

  return tasks;
}

// ---------------------------------------------------------------------------
// User contribution stats (profile cards)
// ---------------------------------------------------------------------------

export type UserContributionStats = {
  tasksDone: number;
  accumulatedPoints: number;
  sprintsDone: number;
  commitsDone: number;
};

type GithubContributor = {
  login: string;
  contributions: number;
};

export async function getUserContributionStats(
  owner: string,
  repo: string,
  username: string,
  userAccessToken: string,
): Promise<UserContributionStats> {
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
  const installationToken = await getInstallationToken(installationId);

  const [closedIssues, contributors, projectData] = await Promise.all([
    githubPaginatedFetchJson<GithubIssue>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?assignee=${encodeURIComponent(username)}&state=closed`,
      installationToken,
    ),
    githubPaginatedFetchJson<GithubContributor>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors`,
      installationToken,
    ),
    getProjectData(owner, repo, installationToken),
  ]);

  const issuesOnly = closedIssues.filter((i) => !i.pull_request);

  const tasksDone = issuesOnly.length;

  const accumulatedPoints = issuesOnly.reduce(
    (sum, i) => sum + (projectData.estimateMap.get(i.number) ?? 0),
    0,
  );

  const distinctMilestones = new Set<number>();
  for (const issue of issuesOnly) {
    if (issue.milestone) distinctMilestones.add(issue.milestone.number);
  }
  const sprintsDone = distinctMilestones.size;

  const matched = contributors.find(
    (c) => c.login.toLowerCase() === username.toLowerCase(),
  );
  const commitsDone = matched?.contributions ?? 0;

  return { tasksDone, accumulatedPoints, sprintsDone, commitsDone };
}

// ---------------------------------------------------------------------------
// Sprint history (last N milestones) — for Story Points & Sprint Tasks charts
// ---------------------------------------------------------------------------

export type SprintData = {
  milestone: MilestoneDto;
  totalIssues: number;
  closedIssues: number;
  totalPoints: number;
  completedPoints: number;
};

export async function getSprintHistoryData(
  owner: string,
  repo: string,
  userAccessToken: string,
  count = 5,
): Promise<SprintData[]> {
  const installationId = await getInstallationIdForUser(userAccessToken, owner);
  const installationToken = await getInstallationToken(installationId);

  // Fetch recent closed milestones + open milestones and pick the last `count`
  const [openMilestones, closedMilestones] = await Promise.all([
    githubPaginatedFetchJson<GithubMilestone>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=open&sort=due_on&direction=asc`,
      installationToken,
    ),
    githubPaginatedFetchJson<GithubMilestone>(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=closed&sort=due_on&direction=desc`,
      installationToken,
    ),
  ]);

  // Combine: closed (most recent first) + open, then take last `count`
  const combined = [...closedMilestones.slice(0, count), ...openMilestones]
    .sort((a, b) => {
      const aDate = a.due_on ? new Date(a.due_on).getTime() : 0;
      const bDate = b.due_on ? new Date(b.due_on).getTime() : 0;
      return aDate - bDate;
    })
    .slice(-count);

  if (combined.length === 0) return [];

  // Fetch estimates from GitHub Projects once
  const { estimateMap } = await getProjectData(owner, repo, installationToken);

  // For each milestone fetch all issues
  const results = await Promise.all(
    combined.map(async (milestone): Promise<SprintData> => {
      const issues = await githubPaginatedFetchJson<GithubIssue>(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?milestone=${milestone.number}&state=all`,
        installationToken,
      );

      const filtered = issues.filter((i) => !i.pull_request);
      const closed = filtered.filter((i) => i.state === "closed");

      const totalPoints = filtered.reduce(
        (sum, i) => sum + (estimateMap.get(i.number) ?? 0),
        0,
      );
      const completedPoints = closed.reduce(
        (sum, i) => sum + (estimateMap.get(i.number) ?? 0),
        0,
      );
      return {
        milestone: toMilestoneDto(milestone),
        totalIssues: filtered.length,
        closedIssues: closed.length,
        totalPoints,
        completedPoints,
      };
    }),
  );

  return results;
}
