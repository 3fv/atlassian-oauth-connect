import should from "should"
   import nock from "nock"
   import moment from "moment"
   import qs from "qs"
   import extend from "extend"
   import { getAlgorithm } from "atlassian-jwt"
   import * as jwt from "atlassian-jwt"
   import * as oauth2 from "../oauth2"

describe('oauth2', function () {

    let hostBaseUrl = 'https://test.atlassian.net';
    let issuer = 'com.atlassian.test';
    let oauthClientId = 'my.oauth-client_Id';
    let sharedSecret = 'a-s3cr3t-k3y';

    describe('#createJwtClaim()', function () {
        it('Claimset should have correct iss claim', function (done) {
            let token = oauth2.createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, "admin");
            token.iss.should.be.eql("urn:atlassian:connect:clientid:" + oauthClientId);
            done();
        });

        it('Claimset should have correct sub claim', function (done) {
            let token = oauth2.createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, "admin");
            token.sub.should.be.eql("urn:atlassian:connect:userkey:admin");
            done();
        });

        it('Claimset should correctly encode user key in sub claim', function (done) {
            let userkey = "苏千";
            let token = oauth2.createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, userkey);
            token.sub.should.equal("urn:atlassian:connect:userkey:" + userkey);
            done();
        });

        it('Claimset should have correct aud claim', function (done) {
            let token = oauth2.createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, "admin");
            token.aud.should.be.eql("https://oauth-2-authorization-server.services.atlassian.com");
            done();
        });

        it('Claimset should respect custom aud parameter', function (done) {
            let token = oauth2.createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, "admin", "custom-aud");
            token.aud.should.be.eql("custom-aud");
            done();
        });


        it('Claimset should have correct tnt claim', function (done) {
            let token = oauth2.createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, "admin");
            token.tnt.should.be.eql(hostBaseUrl);
            done();
        });

        it('Claimset should have a number iat claim', function (done) {
            let token = oauth2.createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, "admin");
            token.iat.should.be.a.Number();
            done();
        });

        it('Claimset should have a number exp claim', function (done) {
            let token = oauth2.createUserKeyAssertionPayload(hostBaseUrl, oauthClientId, "admin");
            token.exp.should.be.a.Number();
            done();
        });

        it('Claimset should have aaid if supplied', function(done) {
            let aaid = "21d6059f-cdfe-4db7-85c7-4a250c94667a";
            let token = oauth2.createAAIDAssertingPayload(hostBaseUrl, oauthClientId, aaid);
            token.sub.should.be.eql('urn:atlassian:connect:useraccountid:' + aaid);
            done();
        })
    });

    describe('#getAccessToken()', function () {

        function createBaseOpts(opts) {
            return extend({
                hostBaseUrl: hostBaseUrl,
                oauthClientId: oauthClientId,
                userKey: 'admin',
                scopes: ['READ', 'WRITE'],
                sharedSecret: sharedSecret
            }, opts || {});
        }

        function interceptRequest(testCallback: any, replyCallback: Function | number, opts:any = {}) {
            opts = opts || {};
            let interceptor = nock(opts.authorizationServerBaseUrl || 'https://oauth-2-authorization-server.services.atlassian.com')
                                .post(opts.authorizationPath || '/oauth2/token')
                                .reply(replyCallback);

            oauth2.getAccessToken(createBaseOpts(opts)).then(function () {
                interceptor.done(); // will throw assertion if endpoint is not intercepted
                testCallback();
            }, function (err) {
                testCallback(err || new Error('access token retrieval should have reported success'));
            });
        }

        function interceptFailedRequest(testCallback:any, replyCallback:Function | number, failureMessage:string, opts:any = {}) {
            let interceptor = nock('https://oauth-2-authorization-server.services.atlassian.com')
                .post('/oauth2/token')
                .reply(replyCallback);

            oauth2.getAccessToken(createBaseOpts(opts)).then(function () {
                interceptor.done(); // will throw assertion if endpoint is not intercepted
                testCallback(new Error(failureMessage));
            }, function () {
                interceptor.done(); // will throw assertion if endpoint is not intercepted
                testCallback();
            });
        }

        it('Retrieves access token from OAuth service', function (done) {
            interceptRequest(done, 200);
        });

        it('Retrieves access token from alternative OAuth service', function (done) {
            interceptRequest(done, 200, {
                authorizationServerBaseUrl: 'https://auth.example.com',
                authorizationPath: '/some/other/path'
            });
        });

        it('Rejects if access token response code is > 299', function (done) {
            interceptFailedRequest(done, 400, 'should reject if response code is 400');
        });

        it('Rejects if access token response code is < 200', function (done) {
            interceptFailedRequest(done, 110, 'should reject if response code is 110');
        });


        it('Accept header is application/json', function (done) {
            interceptRequest(done, function () {
                this.req.headers.accept.should.be.eql("application/json");
            });
        });

        it('Request content-type is application/x-www-form-urlencoded', function (done) {
            interceptRequest(done, function () {
                this.req.headers['content-type'].should.be.eql("application/x-www-form-urlencoded");
            });
        });

        it('Request grant_type is \'urn:ietf:params:oauth:grant-type:jwt-bearer\'', function (done) {
            interceptRequest(done, function (uri, requestBody) {
                let body = qs.parse(requestBody);
                body.grant_type.should.be.eql('urn:ietf:params:oauth:grant-type:jwt-bearer');
            });
        });

        it('Request assertion exists', function (done) {
            interceptRequest(done, function (uri, requestBody) {
                let body = qs.parse(requestBody);
                should.exist(body.assertion);
            });
        });

        it('Request assertion is a JWT token with an issuer', function (done) {
            interceptRequest(done, function (uri, requestBody) {
                let body = qs.parse(requestBody);
                should.exist(jwt.decodeSymmetric(body.assertion as any, sharedSecret, getAlgorithm(body.assertion as any)).iss);
            });
        });

        it('Request assertion is a JWT token with custom baseurl as aud', function (done) {
            let customAuthUrl = 'https://auth2.atlassian.io';
            interceptRequest(done, function (uri, requestBody) {
                let body = qs.parse(requestBody);
                jwt.decodeSymmetric(body.assertion as any, sharedSecret, getAlgorithm(body.assertion as any)).aud.should.be.eql([customAuthUrl]);
            }, { authorizationServerBaseUrl: customAuthUrl });
        });

        it('Request should work when only accountId provided', function(done) {
            interceptRequest(done, 200, {
                userKey: null, // this should remove the 'admin' default.
                userAccountId: '21d6059f-cdfe-4db7-85c7-4a250c94667a'
            })
        });

        it('Request should work when both accountId and userKey supplied', function(done) {
            // It should use accountId if both provided
            interceptRequest(done, 200, {
                userKey: 'admin',
                userAccountId: '21d6059f-cdfe-4db7-85c7-4a250c94667a'
            });
        });

        describe('scopes', function () {
            it('no scopes', function (done) {
                interceptRequest(done, function (uri, requestBody) {
                    let body = qs.parse(requestBody);
                    should.not.exist(body.scope);
                }, { scopes: false });
            });

            it('one scope', function (done) {
                interceptRequest(done, function (uri, requestBody) {
                    let body = qs.parse(requestBody);
                    body.scope.should.be.eql('READ');
                }, { scopes: ['READ'] });
            });

            it('two scopes', function (done) {
                interceptRequest(done, function (uri, requestBody) {
                    let body = qs.parse(requestBody);
                    body.scope.should.be.eql('READ WRITE');
                }, { scopes: ['READ', 'WRITE'] });
            });

            it('two scopes reversed', function (done) {
                interceptRequest(done, function (uri, requestBody) {
                    let body = qs.parse(requestBody);
                    body.scope.should.be.eql('WRITE READ');
                }, { scopes: ['WRITE', 'READ'] });
            });

            it('two scopes in one string', function (done) {
                interceptRequest(done, function (uri, requestBody) {
                    let body = qs.parse(requestBody);
                    body.scope.should.be.eql('READ WRITE');
                }, { scopes: ['READ WRITE'] });
            });

            it('lowercase scopes are uppercased', function (done) {
                interceptRequest(done, function (uri, requestBody) {
                    let body = qs.parse(requestBody);
                    body.scope.should.be.eql('READ WRITE');
                }, { scopes: ['read', 'WriTe'] });
            });
        });
    });
});
