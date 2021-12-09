


## Usage

```javascript
var oauth2 = require('atlassian-oauth2');

var options = {
    hostBaseUrl: 'https://instance.atlassian.net',
    oauthClientId: '{oauth client id your add-on was given at installation}',
    sharedSecret: '{the shared secret your add-on was given at installation}',
    userKey: '{the userkey of the user to retreive the token for}',
    scopes: ['{an array of scopes requested}']
};

oauth2.getAccessToken(options).then(function (token) {
    console.log(token);
    // token.access_token = '{your access token}'
    // token.expires_in = '{expiry time}'
    // token.token_type = 'Bearer'
});
```
