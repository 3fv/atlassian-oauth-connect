import type { AtlassianScopeKind } from "./AtlassianOAuthScopes"

export interface AtlassianOAuthClientConfig {
  clientId: string
  clientSecret?: string
  offline?: boolean
  scope: AtlassianScopeKind | AtlassianScopeKind[]
  redirectUri: string
  state?: string
}

export type AtlassianOAuthOptions = Partial<AtlassianOAuthClientConfig>


export const AtlassianOAuthGrantType ="authorization_code" 

export type AtlassianOAuthGrantType = typeof AtlassianOAuthGrantType

export type AtlassianOAuthTokenType = "access" | "id"

export interface AtlassianOAuthTokenData {
  refreshToken?: string
  type: AtlassianOAuthTokenType
  token: string
  expiresIn: number
  scope: AtlassianScopeKind[]
}



export interface AtlassianOAuthCodeToTokenRequest {
  grant_type: AtlassianOAuthGrantType
  client_id: string
  client_secret: string
  code: string
  redirect_uri: string
}

export interface AtlassianOAuthCodeToTokenResponse {
  refresh_token?: string
  access_token: string
  expires_in: number
  scope: string
}

export const AtlassianDefaultHeaders = {
  "content-type": "application/json",
  accept: "application/json"
}