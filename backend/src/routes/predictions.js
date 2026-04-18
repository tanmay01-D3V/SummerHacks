const express = require('express')
const PredictionLog = require('../models/PredictionLog')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

// Get prediction history
router.get('/', authRequired, async (req, res) => {
  try {
    const logs = await PredictionLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ predictions: logs.map((l) => l.toJSON()) })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch predictions', error: error.message })
  }
})

// Create a new prediction log
router.post('/', authRequired, async (req, res) => {
  try {
    const { stressScore, riskLevel, triggers, recommendations, rawMetrics } = req.body

    if (stressScore === undefined || !riskLevel) {
      return res.status(400).json({ message: 'Stress score and risk level are required' })
    }

    const log = await PredictionLog.create({
      user: req.user._id,
      stressScore,
      riskLevel,
      triggers,
      recommendations,
      rawMetrics,
    })

    res.status(201).json({ prediction: log.toJSON() })
  } catch (error) {
    res.status(500).json({ message: 'Failed to save prediction log', error: error.message })
  }
})

module.exports = router
