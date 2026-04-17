const express = require('express')
const UserRecord = require('../models/UserRecord')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

const SCREEN_TYPES = new Set(['screen_time', 'screen_time_log', 'screen_log', 'screen_time_entry'])
const MOOD_TYPES = new Set(['mood_checkin', 'mood_log', 'mood_score', 'mood_entry'])

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const startOfDay = (date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return startOfDay(next)
}

const getDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDayLabel = (date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)

const moodLabelToScore = (label) => {
  const normalized = String(label || '').trim().toLowerCase()
  if (!normalized) return null

  if (['great', 'excellent', 'energized', 'happy', 'awesome', 'fantastic'].some((word) => normalized.includes(word))) return 9
  if (['good', 'calm', 'steady', 'focused', 'okay', 'fine'].some((word) => normalized.includes(word))) return 7
  if (['neutral', 'meh', 'average'].some((word) => normalized.includes(word))) return 5
  if (['tired', 'low', 'sad', 'stressed', 'anxious', 'irritated', 'bad'].some((word) => normalized.includes(word))) return 3
  if (['overwhelmed', 'exhausted', 'burned out', 'burnt out'].some((word) => normalized.includes(word))) return 2
  return null
}

const extractScreenHours = (record) => {
  const candidates = [
    record.value?.hours,
    record.payload?.hours,
    record.value?.durationHours,
    record.payload?.durationHours,
    record.value?.amount,
    record.payload?.amount,
  ]

  for (const candidate of candidates) {
    const numeric = Number(candidate)
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric
    }
  }

  const minutesCandidates = [record.value?.minutes, record.payload?.minutes]
  for (const candidate of minutesCandidates) {
    const numeric = Number(candidate)
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric / 60
    }
  }

  return 0
}

const extractMoodScore = (record) => {
  const candidates = [
    record.value?.score,
    record.payload?.score,
    record.value?.moodScore,
    record.payload?.moodScore,
  ]

  for (const candidate of candidates) {
    const numeric = Number(candidate)
    if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 10) {
      return numeric
    }
  }

  const labelCandidates = [
    record.value?.label,
    record.payload?.label,
    record.value?.mood,
    record.payload?.mood,
  ]

  for (const candidate of labelCandidates) {
    const score = moodLabelToScore(candidate)
    if (score) {
      return score
    }
  }

  return null
}

const createCellInsight = ({ dateLabel, screenTimeHours, nextDayMoodScore }) => {
  if (screenTimeHours > 0 && nextDayMoodScore != null) {
    const dipPercent = Math.max(0, Math.round(((10 - nextDayMoodScore) / 10) * 100))
    return `On ${dateLabel}, ${screenTimeHours.toFixed(1)}h of screen time was followed by a ${dipPercent}% dip in morning energy.`
  }

  if (screenTimeHours > 0) {
    return `On ${dateLabel}, ${screenTimeHours.toFixed(1)}h of screen time was logged. Add the next-day mood check-in to complete the pattern.`
  }

  if (nextDayMoodScore != null) {
    return `On ${dateLabel}, the next-day mood score landed at ${nextDayMoodScore}/10, but there was no screen-time log to compare against.`
  }

  return `On ${dateLabel}, there is not enough screen-time or mood data yet.`
}

router.get('/correlation', authRequired, async (req, res) => {
  try {
    const todayStart = startOfDay(new Date())
    const windowStart = addDays(todayStart, -27)
    const windowEnd = addDays(todayStart, 2)

    const records = await UserRecord.find({
      user: req.user._id,
      createdAt: {
        $gte: windowStart,
        $lt: windowEnd,
      },
    }).sort({ createdAt: 1 })

    const byDay = new Map()
    const ensureDay = (date) => {
      const key = getDateKey(date)
      if (!byDay.has(key)) {
        byDay.set(key, {
          date,
          screenRecords: [],
          moodRecords: [],
        })
      }
      return byDay.get(key)
    }

    records.forEach((record) => {
      const date = startOfDay(new Date(record.createdAt))
      const dayBucket = ensureDay(date)
      if (SCREEN_TYPES.has(record.type)) {
        dayBucket.screenRecords.push(record)
      }
      if (MOOD_TYPES.has(record.type)) {
        dayBucket.moodRecords.push(record)
      }
    })

    const grid = Array.from({ length: 28 }, (_, index) => {
      const date = addDays(windowStart, index)
      const nextDate = addDays(date, 1)
      const dayBucket = byDay.get(getDateKey(date))
      const nextDayBucket = byDay.get(getDateKey(nextDate))

      const screenTimeHours = (dayBucket?.screenRecords || []).reduce((total, record) => total + extractScreenHours(record), 0)
      const nextDayMoodScores = (nextDayBucket?.moodRecords || [])
        .map((record) => extractMoodScore(record))
        .filter((score) => Number.isFinite(score))

      const nextDayMoodScore = nextDayMoodScores.length
        ? nextDayMoodScores.reduce((total, score) => total + score, 0) / nextDayMoodScores.length
        : null

      const screenNorm = clamp(screenTimeHours / 8, 0, 1)
      const moodNorm = nextDayMoodScore == null ? 0.5 : clamp((nextDayMoodScore - 1) / 9, 0, 1)
      const inverseMood = 1 - moodNorm

      const densityWeight = nextDayMoodScore == null
        ? clamp(0.08 + screenNorm * 0.35, 0.05, 0.42)
        : clamp(0.08 + screenNorm * 0.45 + inverseMood * 0.45 + screenNorm * inverseMood * 0.4, 0.05, 0.98)

      const dateLabel = formatDayLabel(date)
      const insight = createCellInsight({
        dateLabel,
        screenTimeHours,
        nextDayMoodScore: nextDayMoodScore == null ? null : Number(nextDayMoodScore.toFixed(1)),
      })

      return {
        id: getDateKey(date),
        date: date.toISOString(),
        dateLabel,
        screenTimeHours: Number(screenTimeHours.toFixed(1)),
        nextDayMoodScore: nextDayMoodScore == null ? null : Number(nextDayMoodScore.toFixed(1)),
        densityWeight: Number(densityWeight.toFixed(3)),
        insight,
      }
    })

    const comparableCells = grid.filter((cell) => cell.screenTimeHours > 0 && cell.nextDayMoodScore != null)
    const bestCells = comparableCells.filter((cell) => cell.nextDayMoodScore >= 7)
    const bestAverageScreen = bestCells.length
      ? bestCells.reduce((total, cell) => total + cell.screenTimeHours, 0) / bestCells.length
      : 0
    const weightedAverageScreen = comparableCells.length
      ? comparableCells.reduce((total, cell) => total + cell.screenTimeHours * cell.densityWeight, 0) /
        comparableCells.reduce((total, cell) => total + cell.densityWeight, 0)
      : 0

    const summaryText = bestAverageScreen && bestAverageScreen < 4
      ? 'Your best days follow < 4h of screen time. Current trajectory suggests a dip.'
      : weightedAverageScreen > 4
        ? 'Your strongest days appear closer to 4h of screen time or less. The current trajectory suggests a dip.'
        : 'Your strongest days still sit below the 4h screen-time mark. The trend looks steadier when you keep it light.'

    return res.json({
      correlation: {
        grid,
        summaryText,
        windowStart: windowStart.toISOString(),
        windowEnd: todayStart.toISOString(),
        bestAverageScreen: Number(bestAverageScreen.toFixed(1)),
        weightedAverageScreen: Number(weightedAverageScreen.toFixed(1)),
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load correlation analytics.', error: error.message })
  }
})

module.exports = router
