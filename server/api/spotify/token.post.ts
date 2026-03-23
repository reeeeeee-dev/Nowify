import { setSessionPayload } from "../../utils/spotifySession"
import {
  buildSessionFromTokenResponse,
  exchangeWithSpotify,
} from "../../utils/spotifyTokenExchange"

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    grant_type?: string
    code?: string
    redirect_uri?: string
  }>(event)

  if (body.grant_type !== "authorization_code") {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Only authorization_code is supported; use session cookie for refresh",
    })
  }

  if (!body.code?.trim() || !body.redirect_uri?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "code and redirect_uri are required",
    })
  }

  const params = new URLSearchParams()
  params.set("grant_type", "authorization_code")
  params.set("code", body.code)
  params.set("redirect_uri", body.redirect_uri)

  const result = await exchangeWithSpotify(event, params)

  if (!result.ok) {
    setResponseStatus(event, result.status)
    return result.data
  }

  const session = buildSessionFromTokenResponse(result.data)
  if (!session) {
    throw createError({
      statusCode: 502,
      statusMessage: "Invalid token response from Spotify",
    })
  }

  setSessionPayload(event, session)

  return { ok: true as const }
})
