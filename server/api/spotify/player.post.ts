import type { H3Event } from "h3"
import type { SessionPayload } from "../../utils/sessionCrypto"
import {
  clearSessionCookie,
  refreshSessionIfNeeded,
  setSessionPayload,
} from "../../utils/spotifySession"
import {
  buildSessionFromTokenResponse,
  exchangeWithSpotify,
} from "../../utils/spotifyTokenExchange"

const PLAYER_BASE = "https://api.spotify.com/v1/me/player"

type PlayerAction = "play" | "pause" | "next" | "previous"

const PLAYER_ENDPOINTS: Record<PlayerAction, { method: string; path: string }> =
  {
    play: { method: "PUT", path: `${PLAYER_BASE}/play` },
    pause: { method: "PUT", path: `${PLAYER_BASE}/pause` },
    next: { method: "POST", path: `${PLAYER_BASE}/next` },
    previous: { method: "POST", path: `${PLAYER_BASE}/previous` },
  }

async function sendPlayerCommand(
  accessToken: string,
  action: PlayerAction,
): Promise<Response> {
  const spec = PLAYER_ENDPOINTS[action]
  return fetch(spec.path, {
    method: spec.method,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

async function playerCommandWithRefresh(
  event: H3Event,
  session: SessionPayload,
  action: PlayerAction,
): Promise<Response> {
  const res = await sendPlayerCommand(session.accessToken, action)

  if (res.status !== 401) {
    return res
  }

  const params = new URLSearchParams()
  params.set("grant_type", "refresh_token")
  params.set("refresh_token", session.refreshToken)

  const refreshResult = await exchangeWithSpotify(event, params)
  if (!refreshResult.ok) {
    clearSessionCookie(event)
    return res
  }

  const next = buildSessionFromTokenResponse(
    refreshResult.data,
    session.refreshToken,
  )
  if (!next) {
    clearSessionCookie(event)
    return res
  }
  setSessionPayload(event, next)
  return sendPlayerCommand(next.accessToken, action)
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" })
  }

  const session = await refreshSessionIfNeeded(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" })
  }

  const body = await readBody<{ action?: string }>(event)
  const action = body?.action as PlayerAction | undefined
  const valid: PlayerAction[] = ["play", "pause", "next", "previous"]
  if (!action || !valid.includes(action)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid action" })
  }

  const res = await playerCommandWithRefresh(event, session, action)

  if (res.status === 401) {
    clearSessionCookie(event)
    throw createError({ statusCode: 401, statusMessage: "Session expired" })
  }

  if (res.status === 204 || res.ok) {
    return { ok: true as const }
  }

  const errText = await res.text()
  const parsed: unknown = (() => {
    try {
      return JSON.parse(errText) as unknown
    } catch {
      return { raw: errText }
    }
  })()

  setResponseStatus(event, res.status)
  return { ok: false as const, status: res.status, error: parsed }
})
