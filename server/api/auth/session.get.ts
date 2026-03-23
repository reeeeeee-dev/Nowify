import { getSessionPayload } from "../../utils/spotifySession"

export default defineEventHandler((event) => {
  const payload = getSessionPayload(event)
  return {
    authenticated: payload !== null,
  }
})
