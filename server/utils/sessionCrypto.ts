import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto"

const ALGO = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT = "nowify-session-v1"

export type SessionPayload = {
  accessToken: string
  refreshToken: string
  /** Unix timestamp (ms) when the access token expires */
  expiresAt: number
}

function getKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32)
}

export function encryptSessionPayload(
  data: SessionPayload,
  secret: string,
): string {
  const key = getKey(secret)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url")
}

export function decryptSessionPayload(
  token: string,
  secret: string,
): SessionPayload | null {
  try {
    const buf = Buffer.from(token, "base64url")
    const iv = buf.subarray(0, IV_LENGTH)
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
    const key = getKey(secret)
    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])
    return JSON.parse(decrypted.toString("utf8")) as SessionPayload
  } catch {
    return null
  }
}
