const express = require('express')
const UserRecord = require('../models/UserRecord')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

const DAILY_TARGETS = {
  meal_log: 4,
  hydration_log: 8,
}

const getAmount = (record) => {
  const amount = Number(record.value?.amount ?? record.payload?.amount ?? 1)
  return Number.isFinite(amount) && amount > 0 ? amount : 1
}

const buildStressCulprits = ({ todaysRecords, mealCount, hydrationCount }) => {
  const mealDeficit = Math.max(DAILY_TARGETS.meal_log - mealCount, 0)
  const hydrationDeficit = Math.max(DAILY_TARGETS.hydration_log - hydrationCount, 0)

  const hourlyBuckets = todaysRecords.reduce((acc, record) => {
    const hour = new Date(record.createdAt).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {})

  const busiestHourCount = Math.max(0, ...Object.values(hourlyBuckets))
  const latestMealHour = todaysRecords
    .filter((record) => record.type === 'meal_log')
    .map((record) => new Date(record.createdAt).getHours())[0]
  const lateMealCount = todaysRecords.filter((record) => {
    if (record.type !== 'meal_log') return false
    return new Date(record.createdAt).getHours() >= 20
  }).length

  const cards = []

  cards.push(
    mealDeficit > 0
      ? {
          icon: 'restaurant',
          title: mealCount === 0 ? 'Missed meals' : 'Meal gap',
          text:
            mealCount === 0
              ? 'No meals logged yet today. Missing meals can make stress spikes feel sharper later.'
              : `You are ${mealDeficit} meal(s) short of today's target. Steadier meal timing usually keeps strain lower.`,
        }
      : {
          icon: 'check_circle',
          title: 'Meal rhythm steady',
          text: 'Meal target reached today. That removes one common stress trigger from the day.',
        },
  )

  cards.push(
    hydrationDeficit > 0
      ? {
          icon: 'water_drop',
          title: 'Low hydration',
          text:
            hydrationCount === 0
              ? "No water logs yet. Hydration usually shows up quickly in how focused the day feels."
              : `You're ${hydrationDeficit} litre(s) short of today's hydration goal.`,
        }
      : {
          icon: 'check_circle',
          title: 'Hydration on track',
          text: 'Hydration target reached today. That keeps a common physical stress cue under control.',
        },
  )

  if (lateMealCount > 0) {
    cards.push({
      icon: 'schedule',
      title: 'Late meals',
      text: `${lateMealCount} meal log(s) landed after 8 PM. Late eating often pushes recovery later.`,
    })
  } else if (latestMealHour !== undefined) {
    cards.push({
      icon: 'calendar_month',
      title: 'Meal timing looks clean',
      text: 'No late-night meal spike detected yet. Your meal timing is staying in a calmer range.',
    })
  }

  if (busiestHourCount >= 2) {
    cards.push({
      icon: 'groups',
      title: 'Clustered activity',
      text: `${busiestHourCount} logs arrived in the same hour. Tight bursts often line up with busier, more stressful windows.`,
    })
  } else if (todaysRecords.length > 0) {
    cards.push({
      icon: 'bolt',
      title: 'Logging pace is light',
      text: 'Your entries are spread out, which usually means the day is staying more even.',
    })
  }

  if (!cards.length) {
    cards.push({
      icon: 'bolt',
      title: 'Waiting for live input',
      text: 'Add meal and hydration logs to generate real-time stress cues from MongoDB.',
    })
  }

  return cards.slice(0, 4)
}

router.get('/summary', authRequired, async (req, res) => {
  try {
    const records = await UserRecord.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todaysRecords = records.filter((record) => new Date(record.createdAt) >= todayStart)

    const mealCount = todaysRecords
      .filter((record) => record.type === 'meal_log' && new Date(record.createdAt) >= todayStart)
      .reduce((total, record) => total + getAmount(record), 0)

    const hydrationCount = todaysRecords
      .filter((record) => record.type === 'hydration_log' && new Date(record.createdAt) >= todayStart)
      .reduce((total, record) => total + getAmount(record), 0)

    const todayRecords = todaysRecords.length
    const stressCulprits = buildStressCulprits({
      todaysRecords,
      mealCount,
      hydrationCount,
    })

    return res.json({
      summary: {
        headline: 'Meal and hydration tracker',
        headlineDetail: "Log meals and water. Today's totals are matched against your targets.",
        stressIndex: 64,
        restingHeartRate: 72,
        oxygenLevel: 98,
        focusHours: 0,
        moodLabel: 'Steady',
        moodNote: 'No mood data yet.',
        mealCount,
        mealTarget: 4,
        mealTargetReached: mealCount >= 4,
        hydrationCount,
        hydrationTarget: 8,
        hydrationTargetReached: hydrationCount >= 8,
        totalRecords: records.length,
        todayRecords,
        lastUpdatedAt: records[0]?.createdAt || null,
        mealNote: mealCount >= 4 ? 'Meal target reached for today.' : `${Math.max(4 - mealCount, 0)} meal(s) left today.`,
        hydrationNote: hydrationCount >= 8 ? 'Hydration target reached for today.' : `${Math.max(8 - hydrationCount, 0)} litre(s) left today.`,
        stressCulprits,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load home summary.', error: error.message })
  }
})

module.exports = router
