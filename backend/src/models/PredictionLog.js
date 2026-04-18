const mongoose = require('mongoose')

const predictionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stressScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      required: true,
    },
    triggers: [
      {
        type: String,
        trim: true,
      },
    ],
    recommendations: [
      {
        type: String,
        trim: true,
      },
    ],
    rawMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

predictionLogSchema.set('toJSON', {
  transform: (_, doc) => ({
    id: doc._id.toString(),
    userId: doc.user.toString(),
    stressScore: doc.stressScore,
    riskLevel: doc.riskLevel,
    triggers: doc.triggers,
    recommendations: doc.recommendations,
    createdAt: doc.createdAt,
  }),
})

module.exports = mongoose.model('PredictionLog', predictionLogSchema)
