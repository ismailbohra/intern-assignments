const mongoose = require('mongoose')
const { toJSON } = require('./plugins')

const tokenSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
    },
    createdAt: {
      type: Date,
      expires: '24h',
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// add plugin that converts mongoose to json
tokenSchema.plugin(toJSON)

/**
 * @typedef Token
 */
const Token = mongoose.model('Token', tokenSchema)

module.exports = Token
