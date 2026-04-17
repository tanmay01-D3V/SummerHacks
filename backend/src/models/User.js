const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
      index: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    preferences: {
      theme: { type: String, default: 'aurora' },
      language: { type: String, default: 'en-US' },
      notificationsEnabled: { type: Boolean, default: true },
      voiceEnabled: { type: Boolean, default: true },
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true },
)

userSchema.set('toJSON', {
  transform: (_, doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    preferences: doc.preferences,
    lastLoginAt: doc.lastLoginAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }),
})

module.exports = mongoose.model('User', userSchema)
