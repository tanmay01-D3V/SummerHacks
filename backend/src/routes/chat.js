const express = require('express')
const ChatMessage = require('../models/ChatMessage')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

// Get chat history for the authenticated user
router.get('/', authRequired, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(100)
    res.json({ messages: messages.map((m) => m.toJSON()) })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message })
  }
})

// Save a new chat message
router.post('/', authRequired, async (req, res) => {
  try {
    const { role, content, context } = req.body

    if (!role || !content) {
      return res.status(400).json({ message: 'Role and content are required' })
    }

    const message = await ChatMessage.create({
      user: req.user._id,
      role,
      content,
      context,
    })

    res.status(201).json({ message: message.toJSON() })
  } catch (error) {
    res.status(500).json({ message: 'Failed to save message', error: error.message })
  }
})

module.exports = router
