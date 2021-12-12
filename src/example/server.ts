import express from "express"
import Path from "path"
import Tracer from "tracer"
import { AtlassianOAuthClient } from ".."

const log = Tracer.colorConsole()
const indexFile = Path.resolve(__dirname,"..","..","..","src","example","index.html")
const app = express()
const defaultClientStateId = "124352345235"
const client = new AtlassianOAuthClient({
  clientId: process.env.ATLASSIAN_CLIENT_ID,
  clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
  redirectUri: process.env.ATLASSIAN_REDIRECT_URI,
  scope: process.env.ATLASSIAN_SCOPE.split(" "),
  state: defaultClientStateId
})
app.get("/auth/start", async (req: express.Request,res: express.Response) => {
  const consentUrl = client.getConsentURL() + `&ts=${Date.now()}`
  
  log.info(`Redirecting to atlassian consent: ${consentUrl}`)
  res.redirect(consentUrl)
})


app.get("/auth/callback/atlassian", async (req: express.Request,res: express.Response) => {
  const callbackUrl = req.originalUrl
  log.info(`Callback request received: ${callbackUrl}`)
  
  const code = req.query["code"] as string
  log.info(`Retrieving access token with auth code: ${code}`)
  const tokenData = await client.retrieveAccessToken(code)
  log.info(`Received token: ${tokenData.token}`)

  const resources = await client.getAvailableResources()
  log.info(`Access to resources:`, resources, `with token`, tokenData.token)

  res.redirect(301,`/?token=${tokenData.token}&refreshToken=${tokenData.refreshToken}&expiresIn=${tokenData.expiresIn}&ts=${Date.now()}&resources=${JSON.stringify(resources)}`)
})


app.get("/", async (req: express.Request,res: express.Response) => {
  res.sendFile(indexFile)  
})



app.listen(4000,() => {
  log.info("Example server is listening")
})