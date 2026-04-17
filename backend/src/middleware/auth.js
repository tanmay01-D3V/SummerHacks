const User = require('../models/User')
const { getAuthTokenFromHeader, verifyToken } = require('../utils/crypto')

const authRequired = async (req, res, next) => {
  try {
    const token = getAuthTokenFromHeader(req.headers.authorization || '')
    const payload = verifyToken(token)

    if (!payload?.sub) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    req.auth = { tokenPayload: payload }
    req.user = user
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized', error: error.message })
  }
}

module.exports = { authRequired }
