const express = require('express')
const UserRecord = require('../models/UserRecord')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

const buildQuery = (req) => {
  const query = { user: req.user._id }
  if (req.query?.type) {
    query.type = req.query.type
  }
  if (req.query?.status) {
    query.status = req.query.status
  }
  return query
}

const DAILY_TARGETS = {
  meal_log: 4,
  hydration_log: 8,
}

router.get('/', authRequired, async (req, res) => {
  try {
    const limit = Math.min(Number.parseInt(req.query?.limit || '50', 10) || 50, 100)
    const records = await UserRecord.find(buildQuery(req)).sort({ createdAt: -1 }).limit(limit)
    return res.json({ records: records.map((record) => record.toJSON()) })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load records.', error: error.message })
  }
})

router.post('/', authRequired, async (req, res) => {
  try {
    const type = String(req.body?.type || '').trim()
    if (!type) {
      return res.status(400).json({ message: 'Record type is required.' })
    }
    const amount = Number(req.body?.value?.amount ?? req.body?.payload?.amount ?? 1)
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 1
    const target = DAILY_TARGETS[type]
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const existingTodayTotal = target
      ? (
          await UserRecord.find({
            user: req.user._id,
            type,
            createdAt: { $gte: todayStart },
          })
        ).reduce((total, item) => {
          const currentAmount = Number(item.value?.amount ?? item.payload?.amount ?? 1)
          return total + (Number.isFinite(currentAmount) && currentAmount > 0 ? currentAmount : 1)
        }, 0)
      : 0

    const record = await UserRecord.create({
      user: req.user._id,
      type,
      title: String(req.body?.title || '').trim(),
      value: {
        ...(req.body?.value && typeof req.body.value === 'object' ? req.body.value : {}),
        amount: safeAmount,
      },
      payload: {
        ...(req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {}),
        amount: safeAmount,
      },
      source: String(req.body?.source || 'manual').trim(),
      tags: Array.isArray(req.body?.tags) ? req.body.tags.filter(Boolean) : [],
      status: target && existingTodayTotal + safeAmount >= target ? 'completed' : (req.body?.status || 'active'),
    })

    return res.status(201).json({ record: record.toJSON() })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create record.', error: error.message })
  }
})

router.patch('/:id', authRequired, async (req, res) => {
  try {
    const record = await UserRecord.findOne({ _id: req.params.id, user: req.user._id })
    if (!record) {
      return res.status(404).json({ message: 'Record not found.' })
    }

    const fields = ['type', 'title', 'value', 'payload', 'source', 'tags', 'status']
    for (const field of fields) {
      if (req.body?.[field] !== undefined) {
        record[field] = req.body[field]
      }
    }

    await record.save()
    return res.json({ record: record.toJSON() })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update record.', error: error.message })
  }
})

router.delete('/:id', authRequired, async (req, res) => {
  try {
    const record = await UserRecord.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!record) {
      return res.status(404).json({ message: 'Record not found.' })
    }

    return res.json({ deleted: true, record: record.toJSON() })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete record.', error: error.message })
  }
})

module.exports = router
