const express = require('express')
const PredictionLog = require('../models/PredictionLog')
const UserRecord = require('../models/UserRecord')
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

// Helper to extract numeric value from records
const extractValue = (record) => {
  const v = record.value?.amount ?? record.payload?.amount ?? record.value ?? record.payload
  return typeof v === 'number' ? v : 0
}

// Get proactive alerts (Burnout Detection)
router.get('/proactive-alert', authRequired, async (req, res) => {
  try {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0-6 (Sun-Sat)

    // Only active Wed (3) and Thu (4)
    const isMidWeek = dayOfWeek === 3 || dayOfWeek === 4
    if (!isMidWeek) {
      return res.json({ alert: null })
    }

    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const records = await UserRecord.find({
      user: req.user._id,
      createdAt: { $gte: threeDaysAgo },
      type: { $in: ['screen_time_log', 'focus_session', 'sleep_log'] },
    })

    const workloadRecords = records.filter((r) => r.type === 'screen_time_log' || r.type === 'focus_session')
    const sleepRecords = records.filter((r) => r.type === 'sleep_log')

    const avgWorkload = workloadRecords.length
      ? workloadRecords.reduce((sum, r) => sum + extractValue(r), 0) / 3
      : 0
    const avgSleep = sleepRecords.length ? sleepRecords.reduce((sum, r) => sum + extractValue(r), 0) / 3 : 8

    // Thresholds: High Workload (>6.5h) + Low Sleep (<6h)
    if (avgWorkload > 6.5 && avgSleep < 6) {
      return res.json({
        alert: {
          id: 'burnout-recovery-' + today.toISOString().split('T')[0],
          type: 'recovery_suggestion',
          title: 'Recovery Evening Suggested',
          message: 'Your recent workload is high while sleep is low. A focused relaxation session is recommended tonight.',
          cta: 'Start Pulse Session',
          path: '/intervention', 
          metrics: { avgWorkload: avgWorkload.toFixed(1), avgSleep: avgSleep.toFixed(1) },
        },
      })
    }

    res.json({ alert: null })
  } catch (error) {
    res.status(500).json({ message: 'Failed to process proactive alerts', error: error.message })
  }
})

module.exports = router
