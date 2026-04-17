const express = require('express')
const UserRecord = require('../models/UserRecord')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

const latestByType = (records, type) => records.find((record) => record.type === type)

const getNumber = (record, keys, fallback) => {
  if (!record) return fallback
  for (const key of keys) {
    const direct = Number(record.value?.[key] ?? record.payload?.[key])
    if (Number.isFinite(direct)) return direct
  }
  return fallback
}

const getText = (record, keys, fallback) => {
  if (!record) return fallback
  for (const key of keys) {
    const value = record.value?.[key] ?? record.payload?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallback
}

router.get('/summary', authRequired, async (req, res) => {
  try {
    const records = await UserRecord.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100)
    const pulse = latestByType(records, 'pulse_snapshot')
    const mood = latestByType(records, 'mood_checkin')
    const hydration = latestByType(records, 'hydration_log')
    const focus = latestByType(records, 'focus_session')
    const insight = latestByType(records, 'daily_insight')
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const focusMinutes = records
      .filter((record) => record.type === 'focus_session')
      .reduce((total, record) => total + Number(record.value?.minutes ?? record.payload?.minutes ?? 0), 0)

    const hydrationCount = records.filter((record) => record.type === 'hydration_log').length
    const todayRecords = records.filter((record) => new Date(record.createdAt) >= todayStart).length

    return res.json({
      summary: {
        headline: getText(insight, ['headline', 'title', 'note'], 'Your home summary will appear here once records are saved.'),
        headlineDetail: getText(insight, ['detail', 'note', 'description'], 'Create a mood, focus, or hydration record to populate this dashboard.'),
        stressIndex: getNumber(pulse, ['stressIndex', 'stress', 'score'], 64),
        restingHeartRate: getNumber(pulse, ['restingHeartRate', 'heartRate', 'bpm'], 72),
        oxygenLevel: getNumber(pulse, ['oxygenLevel', 'o2', 'spo2'], 98),
        focusHours: Number((focusMinutes / 60 || Number(focus?.value?.hours ?? focus?.payload?.hours ?? 0)).toFixed(1)),
        moodLabel: getText(mood, ['label', 'mood'], 'Steady'),
        moodNote: getText(mood, ['note', 'description'], 'Mood check-ins will show up here.'),
        hydrationNote: getText(hydration, ['note', 'description'], 'Hydration logs will show up here.'),
        hydrationCount,
        totalRecords: records.length,
        todayRecords,
        lastUpdatedAt: records[0]?.createdAt || null,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load home summary.', error: error.message })
  }
})

module.exports = router
