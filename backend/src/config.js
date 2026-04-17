const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

module.exports = {
  port: toInt(process.env.PORT, 4000),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || '',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  tokenSecret: process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me',
  tokenTtlMs: toInt(process.env.AUTH_TOKEN_TTL_MS, 1000 * 60 * 60 * 24 * 7),
  passwordIterations: toInt(process.env.PASSWORD_HASH_ITERATIONS, 210000),
}
