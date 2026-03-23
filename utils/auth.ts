const AUTH_NAMESPACE = "nowify_auth_state"

export function getStoredAuth(): Record<string, unknown> {
  if (!import.meta.client) {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(AUTH_NAMESPACE)
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function setStoredAuth(authState: Record<string, unknown>) {
  if (!import.meta.client) {
    return
  }
  window.localStorage.setItem(AUTH_NAMESPACE, JSON.stringify(authState))
}
