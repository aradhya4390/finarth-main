import mongoose from 'mongoose'

const entrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  content: String,
  numericValue: Number,
  tags: [String],
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Entry', entrySchema)
