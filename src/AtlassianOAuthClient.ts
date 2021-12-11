import { assert, isArray, isString } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import { AtlassianConfigKeys, ATLASSIAN_CONSENT_URL, AUDIENCE, SCOPE_SEPARATOR } from "./AtlassianOAuthConstants"
import { AtlassianOAuthClientConfig, AtlassianOAuthOptions, AtlassianOAuthTokenData } from "./AtlassianOAuthTypes"
import { defaults } from "lodash"
import { identity, split } from "lodash/fp"


export function isValidConfig(o: any): o is AtlassianOAuthClientConfig {
  return (
    !!o &&
    AtlassianConfigKeys
      .map(key => [key, o[key]])
      .every(
        ([key, value]) =>
          isString(value) || (key === "scope" && isArray(value))
      )
  )
}

export interface AtlassianOAuthClientState {
  accessTokenData: AtlassianOAuthTokenData
}

export class AtlassianOAuthClient {
  /**
   * Current access token state
   */
   protected readonly state: AtlassianOAuthClientState = {
    accessTokenData: null
  }

  /**
   * Get complete state
   * 
   * @returns current state
   */
  getState() {
    return this.state
  }


  /**
   * Update state with a patch
   *
   * @param state partial state patch
   * @returns
   */
  protected setState(state: Partial<AtlassianOAuthClientState>) {
    Object.assign(this.state, state)
    return this.state
  }

  /**
   * Get Access Token with metadata
   * 
   * @returns access token with metadata
   */
  getAccessTokenData() {
    return this.state.accessTokenData
  }

  /**
   * Get just the accesstoken
   */
  getAccessToken() {
    return this.state.accessTokenData?.token
  }

  /**
   * Update current config
   *
   * @param config
   * @returns
   */
  setConfig(config: AtlassianOAuthOptions) {
    Object.assign(this.config, config)

    return this.config
  }

  /**
   * Check if properly configured
   *
   * @returns whether or not config is valid
   */
  isValid(config: AtlassianOAuthClientConfig = this.config) {
    return isValidConfig(config)
  }



  /**
   *
   * @example `https://api.atlassian.com/oauth/token/accessible-resources`
   * [
   *    {
   *      "id": "1324a887-45db-1bf4-1e99-ef0ff456d421",
   *      "name": "Site name",
   *      "url": "https:* your-domain.atlassian.net",
   *      "scopes": [
   *        "write:jira-work",
   *        "read:jira-user",
   *        "manage:jira-configuration"
   *      ],
   *      "avatarUrl": "https:\/\/site-admin-avatar-cdn.prod.public.atl-paas.net\/avatars\/240\/flag.png"
   *    }
   *  ]
   *
   * @returns available resources
   */
   async getAvailableResources() {
    return null
  }


  /**
   * Get consent URL in order to
   * send a redirect resulting in authorization
   * of access for your app
   *
   * @example output `https://auth.atlassian.com/authorize?audience=&client_id=${YOUR_ATLASSIAN_CLIENT_ID}&scope=${YOUR_APP_REQUIRED_SCOPES}&redirect_uri=${YOUR_REDIRECT_URI}&state=${YOUR_USER_BOUND_VALUE}&response_type=code&prompt=consent`
   * @param overrides configuration
   * @returns
   */
   getConsentURL(overrides: AtlassianOAuthOptions = {}) {
    const config = {
      ...this.config,
      ...overrides
    }

    isValidConfig(config)

    const query = {
      audience: AUDIENCE,
      client_id: config.clientId,
      scope: asOption(config.scope)
        .map(scopes => (isArray(scopes) ? scopes.join(SCOPE_SEPARATOR) : scopes))
        .get(),
      redirect_uri: config.redirectUri,
      response_type: "code",
      prompt: "consent",
      state: config.state
    }

    const params = new URLSearchParams(query),
      url = ATLASSIAN_CONSENT_URL + "?" + params.toString()

    return url
  }

  constructor(readonly config: AtlassianOAuthClientConfig) {
    defaults(config, {
      offline: true
    })
    assert(isValidConfig(config), `Invalid oauth config`)
  }
}