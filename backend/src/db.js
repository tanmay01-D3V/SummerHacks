const mongoose = require('mongoose')
const { mongoUri } = require('./config')

let connectionPromise

const connectDb = async () => {
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI. Add it to backend/.env before starting the server.')
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    })
  }

  return connectionPromise
}

module.exports = { connectDb }
