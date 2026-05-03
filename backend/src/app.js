const cors = require('cors')
const express = require('express')
const { clientOrigin } = require('./config')
const authRoutes = require('./routes/auth')
const analyticsRoutes = require('./routes/analytics')
const homeRoutes = require('./routes/home')
const recordRoutes = require('./routes/records')
const chatRoutes = require('./routes/chat')
const predictionRoutes = require('./routes/predictions')

const app = express()

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'sama-backend' })
})

app.use('/api/auth', authRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/home', homeRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/predictions', predictionRoutes)

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
})

app.use((error, req, res, _next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ message: 'Internal server error.' })
})

module.exports = app
