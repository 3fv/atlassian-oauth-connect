import request from "request"
import RSVP from "rsvp"
import * as jwt from "atlassian-jwt"

const EXPIRE_IN_SECONDS = 60,
  AUTHORIZATION_SERVER_URL =
    "https://oauth-2-authorization-server.services.atlassian.com",
  JWT_CLAIM_PREFIX = "urn:atlassian:connect",
  GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer",
  SCOPE_SEPARATOR = " "

/**
 * Creates a JWT claimset for authenticating the add-on to the OAuth2 service.
 *
 * This is the generic base used to generate payloads for both accountId and userKey.
 *
 * @param {String} hostBaseUrl - The fully qualified instance name, for example `https://instance.atlassian.net`
 * @param {String} oauthClientId - The OAuth client id which corresponds to the `hostBaseUrl` which was provided to the add-on during installation
 * @param {String} subClaim - The sub claim to use when making the request to the server.
 * @param {String=} audience - The authorization server to use (only intended to be changed for internal Atlassian use).
 * @returns {Object} A claimset to be encoded and sent with the token request
 */
export function createGenericAssertionPayload(
  hostBaseUrl: string,
  oauthClientId: string,
  subClaim: string,
  audience: string = AUTHORIZATION_SERVER_URL
) {
  let now = Math.floor(Date.now() / 1000)
  let exp = now + EXPIRE_IN_SECONDS

  return {
    iss: JWT_CLAIM_PREFIX + ":clientid:" + oauthClientId,
    tnt: hostBaseUrl,
    sub: subClaim,
    aud: audience,
    iat: now,
    exp: exp,
  }
}

export function createUserKeyAssertionPayload(
  hostBaseUrl: string,
  oauthClientId: string,
  userKey: string,
  audience: string = AUTHORIZATION_SERVER_URL
) {
  let subClaim = JWT_CLAIM_PREFIX + ":userkey:" + userKey
  return createGenericAssertionPayload(
    hostBaseUrl,
    oauthClientId,
    subClaim,
    audience
  )
}

export function createAAIDAssertingPayload(
  hostBaseUrl: string,
  oauthClientId: string,
  aAID: string,
  audience: string = AUTHORIZATION_SERVER_URL
) {
  let subClaim = JWT_CLAIM_PREFIX + ":useraccountid:" + aAID
  return createGenericAssertionPayload(
    hostBaseUrl,
    oauthClientId,
    subClaim,
    audience
  )
}

export interface GetAccessTokenOptions {
    hostBaseUrl: string
    oauthClientId: string
    sharedSecret: string
    audience: string
    scopes: string[]
    userAccountId: string
    userKey: string
    authorizationServerBaseUrl?: string
    authorizationPath?: string
}

/**
 * Retrieves an OAuth 2 access token for a given user and instance by creating a JWT token
 * signed by the add-on's shared secret.
 *
 * @param {Object} opts - A hash defining the parameters of the access token request
 * @param {String} opts.hostBaseUrl - The fully qualified instance name, for example `https://instance.atlassian.net`
 * @param {String} opts.oauthClientId - The OAuth client id which corresponds to the `hostBaseUrl` which was provided to the add-on during installation
 * @param {String} opts.sharedSecret - The shared secret which corresponds to the `hostBaseUrl` which was provided to the add-on during installation
 * @param {String} opts.userAccountId - The account id of the user to retrieve an access token for
 * @param {String} opts.userKey - The user key (not username) of the user to retrieve an access token for (if userAccountId not provided)
 * @param {String} opts.scopes - An array of scopes to request for when creating the access token
 * @param {String=} opts.authorizationServerBaseUrl - An alternative authorization server to use (intended for internal use by Atlassian only)
 * @param {String=} opts.authorizationPath - An alternative authorization path to use (intended for internal use by Atlassian only)
 * @returns {Promise.<Object, Error>} A promise that returns the access token if resolved, or an error if rejected
 */
export function getAccessToken(opts:GetAccessTokenOptions) {
  
  return new RSVP.Promise(function (resolve, reject) {
    let jwtClaims
    if (opts.userAccountId) {
      jwtClaims = createAAIDAssertingPayload(
        opts.hostBaseUrl,
        opts.oauthClientId,
        opts.userAccountId,
        opts.authorizationServerBaseUrl
      )
    } else if (opts.userKey) {
      jwtClaims = createUserKeyAssertionPayload(
        opts.hostBaseUrl,
        opts.oauthClientId,
        opts.userKey,
        opts.authorizationServerBaseUrl
      )
    } else {
      reject("No user identifier (userKey or userAccountId) provided")
    }

    let assertion = jwt.encodeSymmetric(jwtClaims, opts.sharedSecret)

    let formData: Record<string, any> = {
      grant_type: GRANT_TYPE,
      assertion: assertion,
    }

    if (opts.scopes) {
      formData.scope = opts.scopes.join(SCOPE_SEPARATOR).toUpperCase()
    }

    request(
      {
        method: "POST",
        url:
          (opts.authorizationServerBaseUrl || AUTHORIZATION_SERVER_URL) +
          (opts.authorizationPath || "/oauth2/token"),
        form: formData,
        json: true,
        headers: {
          accept: "application/json",
        },
      },
      function (err, response, body) {
        if (err) {
          reject(err)
        } else if (response.statusCode < 200 || response.statusCode > 299) {
          reject(body)
        } else {
          resolve(body)
        }
      }
    )
  })
}
