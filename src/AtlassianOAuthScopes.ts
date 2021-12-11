export enum OAuthStandardScope {
  offline_access = "offline_access"
}

export type OAuthStandardScopeKind =
  | OAuthStandardScope
  | `${OAuthStandardScope}`

export enum JiraScope {
  READ_JIRA_USER = "read:jira-user",
  READ_JIRA_WORK = "read:jira-work",
  WRITE_JIRA_WORK = "write:jira-work",
  MANAGE_JIRA_PROJECT = "manage:jira-project",
  MANAGE_JIRA_CONFIGURATION = "manage:jira-configuration",
  MANAGE_JIRA_WEBHOOK = "manage:jira-webhook"
}

export type JiraScopeKind = JiraScope | `${JiraScope}`

export enum AtlassianDefaultScope {
  READ = "READ",
  WRITE = "WRITE",
  ACT_AS_USER = "ACT_AS_USER"
}

export type AtlassianScopeKind =
  | AtlassianDefaultScope
  | `${AtlassianDefaultScope}`
  | OAuthStandardScopeKind
  | JiraScopeKind
  | string
