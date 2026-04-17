const express = require('express')
const User = require('../models/User')
const UserRecord = require('../models/UserRecord')
const { authRequired } = require('../middleware/auth')
const { hashPassword, signToken, verifyPassword } = require('../utils/crypto')

const router = express.Router()

const sanitizeEmail = (email) => String(email || '').trim().toLowerCase()

const buildSession = async (user) => {
  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  })

  return {
    token,
    user: user.toJSON(),
  }
}

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim()
    const email = sanitizeEmail(req.body?.email)
    const password = String(req.body?.password || '')

    if (name.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long.' })
    }

    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid email address.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const { salt, hash } = hashPassword(password)
    const user = await User.create({
      name,
      email,
      passwordSalt: salt,
      passwordHash: hash,
      preferences: req.body?.preferences || undefined,
    })

    await UserRecord.create({
      user: user._id,
      type: 'auth_event',
      title: 'Account created',
      value: { email: user.email },
      source: 'auth',
      tags: ['auth', 'signup'],
    })

    return res.status(201).json(await buildSession(user))
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user.', error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const email = sanitizeEmail(req.body?.email)
    const password = String(req.body?.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const valid = verifyPassword(password, {
      salt: user.passwordSalt,
      hash: user.passwordHash,
    })

    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    user.lastLoginAt = new Date()
    await user.save()

    await UserRecord.create({
      user: user._id,
      type: 'auth_event',
      title: 'Login',
      value: { email: user.email, at: user.lastLoginAt },
      source: 'auth',
      tags: ['auth', 'login'],
    })

    return res.json(await buildSession(user))
  } catch (error) {
    return res.status(500).json({ message: 'Failed to log in.', error: error.message })
  }
})

router.get('/me', authRequired, async (req, res) => {
  return res.json({ user: req.user.toJSON() })
})

router.patch('/me', authRequired, async (req, res) => {
  try {
    const { name, preferences } = req.body || {}

    if (typeof name === 'string' && name.trim().length >= 2) {
      req.user.name = name.trim()
    }

    if (preferences && typeof preferences === 'object') {
      req.user.preferences = {
        ...req.user.preferences.toObject(),
        ...preferences,
      }
    }

    await req.user.save()
    return res.json({ user: req.user.toJSON() })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile.', error: error.message })
  }
})

module.exports = router
