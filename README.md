# Atlassian OAuth 2 (3LO) Browser/Server Client

## Install

It's a properly configured hybrid module,
so both `commonjs` & `module`/`esm` runtimes are
supported, which means that both `browser` &
`node` environments can you the entire 
library excluding the `decode` functionality,
which I'll eventually convert for browser support
using `cryptojs`, but it's transparently functional
in any evironment now

```shell
yarn add @3fv/atlassian-oauth-connect
```

## Example Implementation (not for prod use)

### Prequistes

First, make sure you've got `direnv` installed via your package manager of choice `brew`, `apt`, `pacman`, etc...


### Setup

Copy `.envrc.templace` to `.envrc` and fill in all the missing fields.  Also, the scope list is `robust`, but the purpose is
to show near every currently available scope, so, go ahead and 
pair it down to what you need.

Populate your redirect URI, client id, and client secret with the values you entered/received [Atlassian Developer Console](https://developer.atlassian.com/console/myapps) when your configured your app

*WARNING*: As mentioned, this is just an example; in a real world scenario the configuration would come from another system like `AWS AppConfig` with appropriate secret management, etc.

First, copy the file: `cp .envrc.template .envrc` 

Next, populate your app's values from the aforementioned `Atlassian Developer Console` App Registration.

```shell
# IN CASE YOUR SHELL DOESN'T DO THIS FOR YOU
PATH_add $PWD/node_modules/.bin

# SCOPES FOR AUTHORIZATION.
# THEY MUST BE SPACE DELIMITED
export ATLASSIAN_SCOPE="\
  read:me \
  offline_access \
  read:jira-user \
  read:jira-work \
  write:jira-work \
  manage:jira-project \
  manage:jira-configuration \
  manage:jira-webhook \
  read:confluence-content.all \
  read:confluence-content.summary \
  write:confluence-content \
  write:confluence-space \
  write:confluence-file \
  read:confluence-props \
  write:confluence-props \
  manage:confluence-project \
  manage:confluence-configuration \
  search:confluence"

# APP REGISTRATION DETAILS
export ATLASSIAN_REDIRECT_URI=<YOUR_ATLASSIAN_REDIRECT_URI>
export ATLASSIAN_CLIENT_ID=<YOUR_ATLASSIAN_CLIENT_ID>
export ATLASSIAN_CLIENT_SECRET=<YOUR_ATLASSIAN_CLIENT_SECRET>
```

### Run the example 

The example server is a very basic html page and express web server that together function as a fairly complete tooling for
testing & verifyingthe atlassian connect integration.

The source is here [./src/example/server.ts](./src/example/server.ts) & [./src/example/index.html](./src/example/index.html)

```
# Install Deps
yarn

# Build & Run Example Server
yarn example:server:start
```

Now you can open a browser to [http://localhost:4000](http://localhost:4000) and play around


### Hackup to play with Atlassian Connect

I figured you'd probably get annoyed if this wasn't easy,
so it's all scripted

To start up the typescript compiler in watch mode
and server via `nodemon`, just run the following

`yarn run example:server:dev`

## Features

- `getAccessibleResources()` queries for all resources (`projects` & `spaces`) for which a user accepted grants. 
Here's an example response.

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "url": "https://3fv.atlassian.net",
    "name": "3fv",
    "scopes": [
      "manage:confluence-configuration",
      "search:confluence",
      "write:confluence-props",
      "read:confluence-props",
      "write:confluence-file",
      "write:confluence-space",
      "write:confluence-content",
      "read:confluence-content.summary",
      "read:confluence-content.all"
    ],
    "avatarUrl": "https://site-admin-avatar-cdn.prod.public.atl-paas.net/avatars/240/triangle.png"
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "url": "https://3fv.atlassian.net",
    "name": "3fv",
    "scopes": [
      "manage:jira-configuration",
      "manage:jira-project",
      "manage:jira-webhook",
      "write:jira-work",
      "read:jira-work",
      "read:jira-user"
    ],
    "avatarUrl": "https://site-admin-avatar-cdn.prod.public.atl-paas.net/avatars/240/triangle.png"
  }
]
```
- `retrieveAccessToken()` for code to token exchange

- `getUserProfile()` to retrieve the current user profile.
```json
{
  "account_id": "0000000000000",
  "email": "aaaa@bbbbbbbb.com",
  "name": "Jonathan Glanz",
  "picture": "https://secure.gravatar.com/avatar/...",
  "account_status": "active",
  "last_updated": "2021-11-15T14:49:38.747Z",
  "nickname": "Jonathan Glanz",
  "locale": "en-US",
  "extended_profile": {
    "job_title": "Software Engineer",
    "team_type": "Software Development"
  },
  "account_type": "atlassian",
  "email_verified": true
}
```

- Token refresh rolling functionality; all the requirements to implement refresh token rolling, 
including the actual refresh token (if you specified the `offline_access` scope) & the expiration data, so you can implement your own refresh token rolling or wait for me to find a reason  :grin:

## Todo

- [ ] Signature Verification (OOB the `atlassian-jwt` package chucks errors when verifying the returned tokens)
- [ ] Caching, right now, if you call `getUserProfile`, `retrieveAccessToken`, etc., every call no matter identical params or not, query the endpoints; so this is kind of important
- [ ] Unit tests would be a good idea  (started & configured, just not implemented :smile:)
- [ ] Plus a few e2e cypress tests (started)

## Credit

Written with love in #NYC by [@jglanz](https://github.com/jglanz) 3FV. Enjoy