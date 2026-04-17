const mongoose = require('mongoose')

const userRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    source: {
      type: String,
      trim: true,
      default: 'manual',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true },
)

userRecordSchema.set('toJSON', {
  transform: (_, doc) => ({
    id: doc._id.toString(),
    userId: doc.user.toString(),
    type: doc.type,
    title: doc.title,
    value: doc.value,
    payload: doc.payload,
    source: doc.source,
    tags: doc.tags,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }),
})

module.exports = mongoose.model('UserRecord', userRecordSchema)
