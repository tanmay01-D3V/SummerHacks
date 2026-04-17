const crypto = require('crypto')
const { passwordIterations, tokenSecret, tokenTtlMs } = require('../config')

const base64UrlEncode = (input) => Buffer.from(input).toString('base64url')
const base64UrlDecode = (input) => Buffer.from(input, 'base64url').toString('utf8')

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const derivedKey = crypto.pbkdf2Sync(password, salt, passwordIterations, 64, 'sha512').toString('hex')
  return { salt, hash: derivedKey }
}

const verifyPassword = (password, stored) => {
  if (!stored?.salt || !stored?.hash) return false
  const { hash } = hashPassword(password, stored.salt)
  const left = Buffer.from(hash, 'hex')
  const right = Buffer.from(stored.hash, 'hex')
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

const signToken = (payload) => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Date.now()
  const body = {
    ...payload,
    iat: now,
    exp: now + tokenTtlMs,
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedBody = base64UrlEncode(JSON.stringify(body))
  const unsigned = `${encodedHeader}.${encodedBody}`
  const signature = crypto.createHmac('sha256', tokenSecret).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}

const verifyToken = (token) => {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [encodedHeader, encodedBody, signature] = parts
  const unsigned = `${encodedHeader}.${encodedBody}`
  const expectedSignature = crypto.createHmac('sha256', tokenSecret).update(unsigned).digest('base64url')

  const signatureBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')
  if (signatureBuffer.length !== expectedBuffer.length) return null
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encodedBody))
    if (!payload?.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

const getAuthTokenFromHeader = (header = '') => {
  const [scheme, token] = header.split(' ')
  return scheme === 'Bearer' ? token : null
}

module.exports = {
  getAuthTokenFromHeader,
  hashPassword,
  signToken,
  verifyPassword,
  verifyToken,
}
