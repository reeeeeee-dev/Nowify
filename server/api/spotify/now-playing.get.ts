import {
  clearSessionCookie,
  refreshSessionIfNeeded,
  setSessionPayload,
} from "../../utils/spotifySession"
import {
  buildSessionFromTokenResponse,
  exchangeWithSpotify,
} from "../../utils/spotifyTokenExchange"

const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"

export default defineEventHandler(async (event) => {
  let session = await refreshSessionIfNeeded(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" })
  }

  async function fetchNowPlaying(accessToken: string) {
    return fetch(NOW_PLAYING_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  let res = await fetchNowPlaying(session.accessToken)

  if (res.status === 401) {
    const params = new URLSearchParams()
    params.set("grant_type", "refresh_token")
    params.set("refresh_token", session.refreshToken)

    const refreshResult = await exchangeWithSpotify(event, params)
    if (!refreshResult.ok) {
      clearSessionCookie(event)
      throw createError({ statusCode: 401, statusMessage: "Session expired" })
    }

    const next = buildSessionFromTokenResponse(
      refreshResult.data,
      session.refreshToken,
    )
    if (!next) {
      clearSessionCookie(event)
      throw createError({ statusCode: 401, statusMessage: "Session expired" })
    }
    setSessionPayload(event, next)
    session = next
    res = await fetchNowPlaying(session.accessToken)
  }

  if (res.status === 204) {
    setResponseStatus(event, 204)
    return null
  }

  if (!res.ok) {
    const errBody = await res.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(errBody)
    } catch {
      parsed = { raw: errBody }
    }
    setResponseStatus(event, res.status)
    return parsed
  }

  return await res.json()
})
