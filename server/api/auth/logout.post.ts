import { clearSessionCookie } from "../../utils/spotifySession"

export default defineEventHandler((event) => {
  clearSessionCookie(event)
  return { ok: true as const }
})
