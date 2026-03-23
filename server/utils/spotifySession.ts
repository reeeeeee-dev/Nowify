import type { H3Event } from "h3"
import { deleteCookie, getCookie, setCookie } from "h3"
import type { SessionPayload } from "./sessionCrypto"
import { decryptSessionPayload, encryptSessionPayload } from "./sessionCrypto"
import {
  buildSessionFromTokenResponse,
  exchangeWithSpotify,
} from "./spotifyTokenExchange"

const COOKIE_NAME = "nowify_session"

function sessionSecret(event: H3Event): string {
  const config = useRuntimeConfig(event)
  const secret = config.sessionSecret as string
  if (!secret?.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "NUXT_SESSION_SECRET is not set (required for encrypted session cookies)",
    })
  }
  return secret
}

function sessionSecretForRead(event: H3Event): string | null {
  const config = useRuntimeConfig(event)
  const secret = config.sessionSecret as string
  return secret?.trim() ? secret : null
}

export function getSessionPayload(event: H3Event): SessionPayload | null {
  const raw = getCookie(event, COOKIE_NAME)
  if (!raw) {
    return null
  }
  const secret = sessionSecretForRead(event)
  if (!secret) {
    return null
  }
  return decryptSessionPayload(raw, secret)
}

export function setSessionPayload(event: H3Event, payload: SessionPayload) {
  const token = encryptSessionPayload(payload, sessionSecret(event))
  const isProd = process.env.NODE_ENV === "production"
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, { path: "/" })
}

/** Refresh ~1 minute before expiry */
export function shouldRefreshAccessToken(payload: SessionPayload): boolean {
  return Date.now() >= payload.expiresAt - 60_000
}

/**
 * Returns a session with a valid access token, refreshing and persisting the cookie when needed.
 */
export async function refreshSessionIfNeeded(
  event: H3Event,
): Promise<SessionPayload | null> {
  const payload = getSessionPayload(event)
  if (!payload) {
    return null
  }

  if (!shouldRefreshAccessToken(payload)) {
    return payload
  }

  const params = new URLSearchParams()
  params.set("grant_type", "refresh_token")
  params.set("refresh_token", payload.refreshToken)

  const result = await exchangeWithSpotify(event, params)
  if (!result.ok) {
    clearSessionCookie(event)
    return null
  }

  const next = buildSessionFromTokenResponse(result.data, payload.refreshToken)
  if (!next) {
    clearSessionCookie(event)
    return null
  }

  setSessionPayload(event, next)
  return next
}
