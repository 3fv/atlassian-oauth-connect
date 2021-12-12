import type { AtlassianOAuthClientConfig } from "./AtlassianOAuthTypes"

export const ATLASSIAN_CONSENT_URL = "https://auth.atlassian.com/authorize",
  ATLASSIAN_CODE_EXCHANGE_URL = "https://auth.atlassian.com/oauth/token",
  ATLASSIAN_ACCESSIBLE_RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources",
  ATLASSIAN_TOKEN_URL =
    "https://oauth-2-authorization-server.services.atlassian.com"

export const AUDIENCE = "api.atlassian.com",
  EXPIRE_IN_SECONDS = 60,
  JWT_CLAIM_PREFIX = "urn:atlassian:connect",
  GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer",
  SCOPE_SEPARATOR = " "



export const AtlassianConfigKeys = Array<keyof AtlassianOAuthClientConfig>(
  "clientId",
  "redirectUri",
  "scope",
  "state"
)
