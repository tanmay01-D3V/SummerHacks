const mongoose = require('mongoose')

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

chatMessageSchema.set('toJSON', {
  transform: (_, doc) => ({
    id: doc._id.toString(),
    userId: doc.user.toString(),
    role: doc.role,
    content: doc.content,
    context: doc.context,
    createdAt: doc.createdAt,
  }),
})

module.exports = mongoose.model('ChatMessage', chatMessageSchema)
