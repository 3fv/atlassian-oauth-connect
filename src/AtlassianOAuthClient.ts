import "isomorphic-fetch"
import { assert, isArray, isString } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import {
  AtlassianConfigKeys,
  ATLASSIAN_ACCESSIBLE_RESOURCES_URL,
  ATLASSIAN_CODE_EXCHANGE_URL,
  ATLASSIAN_CONSENT_URL,
  AUDIENCE,
  SCOPE_SEPARATOR
} from "./AtlassianOAuthConstants"
import {
  AtlassianDefaultHeaders,
  AtlassianOAuthClientConfig,
  AtlassianOAuthCodeToTokenRequest,
  AtlassianOAuthGrantType,
  AtlassianOAuthOptions,
  AtlassianOAuthTokenData
} from "./AtlassianOAuthTypes"
import { defaults } from "lodash"
import { identity, split } from "lodash/fp"
import { AtlassianAccessibleResource, AtlassianOAuthCodeToTokenResponse, AtlassianScopeKind } from "."
import { match, __ } from "ts-pattern"
import { isNotEmpty } from "./util"

export function isValidConfig(o: any): o is AtlassianOAuthClientConfig {
  return (
    !!o &&
    AtlassianConfigKeys.map(key => [key, o[key]]).every(
      ([key, value]) => isString(value) || (key === "scope" && isArray(value))
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

  setAccessTokenData(accessTokenData: AtlassianOAuthTokenData) {
    return this.setState({accessTokenData})
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

  get isAuthenticated() {
    return isNotEmpty(this.state.accessTokenData?.token)
  }

  protected assertAuthenticated() {
    assert(
      this.isAuthenticated,
      `Accessible resources is a secured endpoint and there is not a valid access token currently set`
    )
  }

  /**
   * Execute a fetch on a secured endpoint
   *
   * @param input
   * @param init
   * @returns
   */
  fetchAuthenticated(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    this.assertAuthenticated()
    const { token } = this.state.accessTokenData
    return fetch(input, {
      ...(init ?? {}),
      headers: {
        ...(init?.headers ?? {}),
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    })
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
    this.assertAuthenticated()
    const res = await this.fetchAuthenticated(ATLASSIAN_ACCESSIBLE_RESOURCES_URL),
    data: AtlassianAccessibleResource[] = await res.json()
    
    return data
  }

  /**
   * Exchange code for token
   *
   * ```shell
   * curl --request POST \
   *    --url 'https://auth.atlassian.com/oauth/token' \
   *    --header 'Content-Type: application/json' \
   *    --data '{"grant_type": "authorization_code",
   *        "client_id": "YOUR_CLIENT_ID",
   *        "client_secret": "YOUR_CLIENT_SECRET",
   *        "code": "YOUR_AUTHORIZATION_CODE",
   * "redirect_uri": "https://YOUR_APP_CALLBACK_URL"}'
   * ```
   *
   * @param opts
   * @returns
   */
  async retrieveAccessToken(
    code: string,
    overrides: AtlassianOAuthOptions = {}
  ) {
    const config = {
      ...this.config,
      ...overrides
    }

    assert(
      isNotEmpty(config.clientSecret),
      `Server client requires the client secret is not empty`
    )

    const request: AtlassianOAuthCodeToTokenRequest = {
      code,
      grant_type: AtlassianOAuthGrantType,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri
    }

    const res = await fetch(ATLASSIAN_CODE_EXCHANGE_URL, {
      method: "POST",
      body: JSON.stringify(request),
      headers: AtlassianDefaultHeaders
    })

    assert(
      res.status >= 200 && res.status < 400,
      `Failed to get access token (${res.statusText})`
    )

    const body: AtlassianOAuthCodeToTokenResponse = await res.json(),
      data: AtlassianOAuthTokenData = {
        type: "access",
        expiresIn: body.expires_in ?? -1,
        token: body.access_token,
        refreshToken: body.refresh_token,
        scope: match(body.scope)
          .with(__.string, split(SCOPE_SEPARATOR))
          .when(isArray, identity)
          .otherwise(() => []) as AtlassianScopeKind[]
      }

    return this.setState({ accessTokenData: data }).accessTokenData
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
        .map(scopes =>
          isArray(scopes) ? scopes.join(SCOPE_SEPARATOR) : scopes
        )
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
