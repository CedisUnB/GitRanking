export type ApiErrorResponse = {
  error: string;
  code: string;
};

export type RepositoryDto = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
};

export type RepositoryMemberDto = {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  roleName: string | null;
  permissions: {
    pull: boolean;
    push: boolean;
    admin: boolean;
  };
};

export type MilestoneDto = {
  number: number;
  title: string;
  dueOn: string | null;
  description: string | null;
};

export type IssueDto = {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  assignees: string[];
  labels: string[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  milestone: MilestoneDto | null;
};

export type RepositoriesResponse =
  | {
      repositories: RepositoryDto[];
    }
  | {
      notInstalled: true;
      installUrl: string | null;
    };

export type RepositoryMembersResponse = {
  members: RepositoryMemberDto[];
};

export type CurrentMilestoneIssuesResponse = {
  currentMilestone: MilestoneDto | null;
  issues: IssueDto[];
};

export type AssignedOpenIssuesResponse = {
  assignee: string;
  issues: IssueDto[];
};
