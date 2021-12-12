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

export enum ConfluenceScope {
  READ_CONFLUENCE_CONTENT_ALL = "read:confluence-content.all",
  READ_CONFLUENCE_CONTENT_SUMMARY = "read:confluence-content.summary",
  WRITE_CONFLUENCE_CONTENT = "write:confluence-content",
  WRITE_CONFLUENCE_SPACE = "write:confluence-space",
  WRITE_CONFLUENCE_FILE = "write:confluence-file",
  
  READ_CONFLUENCE_PROPS = "read:confluence-props",
  WRITE_CONFLUENCE_PROPS = "write:confluence-props",
  
  MANAGE_CONFLUENCE_PROJECT = "manage:confluence-project",
  MANAGE_CONFLUENCE_CONFIGURATION = "manage:confluence-configuration",
  SEARCH_CONFLUENCE = "search:confluence"
}

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
