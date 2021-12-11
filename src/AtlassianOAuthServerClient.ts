import { asOption } from "@3fv/prelude-ts"
import fetch from "isomorphic-fetch"
import { defaults } from "lodash"
import { identity, split } from "lodash/fp"
import * as jwt from "atlassian-jwt"
import { assert, isArray, isString } from "@3fv/guard"
import { URLSearchParams } from "url"
import { AtlassianScopeKind } from "./AtlassianOAuthScopes"
import {
  AtlassianDefaultHeaders,
  AtlassianOAuthTokenData,
  AtlassianOAuthCodeToTokenRequest,
  AtlassianOAuthCodeToTokenResponse,
  AtlassianOAuthClientConfig,
  AtlassianOAuthGrantType,
  AtlassianOAuthOptions
} from "./AtlassianOAuthTypes"
import { match, __ } from "ts-pattern"
import { AtlassianOAuthClient, isValidConfig } from "./AtlassianOAuthClient"
import { ATLASSIAN_CODE_EXCHANGE_URL, ATLASSIAN_TOKEN_URL, EXPIRE_IN_SECONDS, JWT_CLAIM_PREFIX, SCOPE_SEPARATOR } from "./AtlassianOAuthConstants"
import { isNotEmpty } from "./util"



export class AtlassianOAuthServerClient extends AtlassianOAuthClient {
  
 
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

  constructor(config: AtlassianOAuthClientConfig) {
    super(config)

    assert(isNotEmpty(config.clientSecret),`Server client requires the client secret is not empty`)
  }
}

// /**
//  *
//  * @returns whether the library is configured or not
//  */

// /**
//  * Creates a JWT claimset for authenticating the add-on to the OAuth2 service.
//  *
//  * This is the generic base used to generate payloads for both accountId and userKey.
//  *
//  * @param {String} hostBaseUrl - The fully qualified instance name, for example `https://instance.atlassian.net`
//  * @param {String} oauthClientId - The OAuth client id which corresponds to the `hostBaseUrl` which was provided to the add-on during installation
//  * @param {String} subClaim - The sub claim to use when making the request to the server.
//  * @param {String=} audience - The authorization server to use (only intended to be changed for internal Atlassian use).
//  * @returns {Object} A claimset to be encoded and sent with the token request
//  */
// export function createGenericAssertionPayload(
//   hostBaseUrl: string,
//   oauthClientId: string,
//   subClaim: string,
//   audience: string = ATLASSIAN_TOKEN_URL
// ) {
//   let now = Math.floor(Date.now() / 1000)
//   let exp = now + EXPIRE_IN_SECONDS

//   return {
//     iss: JWT_CLAIM_PREFIX + ":clientid:" + oauthClientId,
//     tnt: hostBaseUrl,
//     sub: subClaim,
//     aud: audience,
//     iat: now,
//     exp: exp
//   }
// }

// export function createUserKeyAssertionPayload(
//   hostBaseUrl: string,
//   oauthClientId: string,
//   userKey: string,
//   audience: string = ATLASSIAN_TOKEN_URL
// ) {
//   let subClaim = JWT_CLAIM_PREFIX + ":userkey:" + userKey
//   return createGenericAssertionPayload(
//     hostBaseUrl,
//     oauthClientId,
//     subClaim,
//     audience
//   )
// }

// export function createAAIDAssertingPayload(
//   hostBaseUrl: string,
//   oauthClientId: string,
//   aAID: string,
//   audience: string = ATLASSIAN_TOKEN_URL
// ) {
//   let subClaim = JWT_CLAIM_PREFIX + ":useraccountid:" + aAID
//   return createGenericAssertionPayload(
//     hostBaseUrl,
//     oauthClientId,
//     subClaim,
//     audience
//   )
// }

// export interface GetAccessTokenOptions {
//   hostBaseUrl: string
//   oauthClientId: string
//   sharedSecret: string
//   audience: string
//   scopes: string[]
//   userAccountId: string
//   userKey: string
//   authorizationServerBaseUrl?: string
//   authorizationPath?: string
// }
