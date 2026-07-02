import mongoose from 'mongoose'

const analysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String },
  filetype: { type: String },
  summary: { type: mongoose.Schema.Types.Mixed },
  extractedData: { type: mongoose.Schema.Types.Mixed },
  dataset: [{ label: String, value: Number }],
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Analysis', analysisSchema)
