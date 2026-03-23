import { applyCatalogAlbumImagesToTrack } from "../../utils/spotifyAlbumCatalog"
import {
  clearSessionCookie,
  refreshSessionIfNeeded,
  setSessionPayload,
} from "../../utils/spotifySession"
import {
  buildSessionFromTokenResponse,
  exchangeWithSpotify,
} from "../../utils/spotifyTokenExchange"

const QUEUE_URL = "https://api.spotify.com/v1/me/player/queue"

export default defineEventHandler(async (event) => {
  let session = await refreshSessionIfNeeded(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" })
  }

  async function fetchQueue(accessToken: string) {
    return fetch(QUEUE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  let res = await fetchQueue(session.accessToken)

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
    res = await fetchQueue(session.accessToken)
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

  const body = (await res.json()) as {
    currently_playing?: unknown
    queue?: unknown[]
  }
  await applyCatalogAlbumImagesToTrack(
    session.accessToken,
    body.currently_playing,
  )
  if (Array.isArray(body.queue)) {
    for (const item of body.queue) {
      await applyCatalogAlbumImagesToTrack(session.accessToken, item)
    }
  }
  return body
})
